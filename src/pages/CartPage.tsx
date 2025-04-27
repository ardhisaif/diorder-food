import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";
import Header from "../components/Header";
import supabase from "../utils/supabase/client";
import { ShoppingBag, Plus, WifiOff, AlertTriangle } from "lucide-react";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import { Merchant } from "../types";
import { CartItemSkeleton } from "../components/Skeletons";
import { indexedDBService } from "../utils/indexedDB";

const WHATSAPP_NUMBER = "628888465289";
const DELIVERY_FEE = 5000;
const VILLAGES = ["Duduksampeyan", "Sumengko", "Petisbenem", "Setrohadi"];

const CartPage: React.FC = () => {
  const {
    getMerchantItems,
    getMerchantTotal,
    customerInfo,
    updateCustomerInfo,
    clearCart,
  } = useCart();
  const navigate = useNavigate();
  const [merchantsWithItems, setMerchantsWithItems] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchMerchantsWithItems = async () => {
      try {
        setIsLoading(true);

        // Initialize IndexedDB
        await indexedDBService.initDB();

        // First try to get cached merchants to show something immediately
        const cachedMerchants = await indexedDBService.getAll("merchantInfo");

        if (cachedMerchants.length > 0) {
          const filteredMerchants = cachedMerchants.filter(
            (m) => getMerchantItems(m.id).length > 0
          );
          setMerchantsWithItems(filteredMerchants);
        }

        // Then fetch from API if online
        if (navigator.onLine) {
          const { data: merchants, error } = await supabase
            .from("merchants")
            .select("*");

          if (error) {
            console.error("Error fetching merchants:", error);
          } else {
            // Cache merchants in IndexedDB
            for (const merchant of merchants) {
              await indexedDBService.update("merchantInfo", merchant);
            }

            const filteredMerchants = merchants.filter(
              (m) => getMerchantItems(m.id).length > 0
            );
            setMerchantsWithItems(filteredMerchants);
          }
        }
      } catch (error) {
        console.error("Error in fetchMerchantsWithItems:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantsWithItems();
  }, [getMerchantItems]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Memoize calculations to avoid redundant recalculations on re-renders
  const {
    cartEmpty,
    hasClosedMerchants,
    subtotal,
    totalAmount,
  } = useMemo(() => {
    const isEmpty = merchantsWithItems.length === 0;
    const openMerchants = merchantsWithItems.filter((m) =>
      isCurrentlyOpen(m.openingHours)
    );
    const hasClosedMerchants = merchantsWithItems.length > openMerchants.length;

    const subtotal = openMerchants.reduce((total, merchant) => {
      return total + getMerchantTotal(merchant.id);
    }, 0);

    return {
      cartEmpty: isEmpty,
      hasClosedMerchants,
      openMerchants,
      subtotal,
      totalAmount: subtotal + DELIVERY_FEE,
    };
  }, [merchantsWithItems, getMerchantTotal]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!customerInfo.name?.trim()) {
      errors.name = "Nama pemesan harus diisi";
    }

    if (!customerInfo.village) {
      errors.village = "Pilih desa pengiriman";
    }

    if (!customerInfo.addressDetail?.trim()) {
      errors.addressDetail = "Detail alamat harus diisi";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    updateCustomerInfo({
      ...customerInfo,
      [name]: value,
    });

    // Clear error when field is filled
    if (value.trim() && formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const handleCheckout = () => {
    if (!validateForm()) {
      return;
    }

    if (hasClosedMerchants) {
      if (
        !confirm(
          "Beberapa merchant saat ini sedang tutup. Hanya makanan dari merchant yang buka yang akan diproses. Lanjutkan?"
        )
      ) {
        return;
      }
    }

    setIsCheckingOut(true);

    // Format the order message for WhatsApp
    let message = `*Pesanan Baru dari diorder*\n\n`;
    message += `*Nama*: ${customerInfo.name}\n`;
    message += `*Alamat*:\n`;
    message += `Kecamatan: Duduksampeyan\n`;
    message += `Desa: ${customerInfo.village}\n`;
    message += `Detail Alamat: ${customerInfo.addressDetail}\n\n`;

    // Add orders from each merchant
    merchantsWithItems.forEach((merchant) => {
      if (isCurrentlyOpen(merchant.openingHours)) {
        const items = getMerchantItems(merchant.id);
        const merchantSubtotal = getMerchantTotal(merchant.id);

        message += `*Detail Pesanan dari ${merchant.name}*:\n`;
        items.forEach((item) => {
          message += `- ${item.name} (${item.quantity}x) = ${formatCurrency(
            item.price * item.quantity
          )}\n`;
          if (item.notes) {
            message += `  Catatan: ${item.notes}\n`;
          }
        });
        message += `Subtotal: ${formatCurrency(merchantSubtotal)}\n\n`;
      }
    });

    message += `Subtotal Pesanan: ${formatCurrency(subtotal)}\n`;
    message += `Ongkir: ${formatCurrency(DELIVERY_FEE)}\n`;
    message += `*Total Keseluruhan*: ${formatCurrency(totalAmount)}\n\n`;

    if (customerInfo.notes) {
      message += `*Catatan*: ${customerInfo.notes}\n\n`;
    }

    message += `Terima kasih telah memesan!`;

    // Track checkout event with Google Analytics
    const trackCheckoutEvent = () => {
      // Generate a simple order ID using timestamp and random string
      const orderId = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      // Create transaction data
      const transactionData = {
        transaction_id: orderId,
        value: totalAmount,
        currency: "IDR",
        shipping: DELIVERY_FEE,
        items: merchantsWithItems.flatMap((merchant) => {
          if (isCurrentlyOpen(merchant.openingHours)) {
            const items = getMerchantItems(merchant.id);
            return items.map((item) => ({
              item_id: `${merchant.id}-${item.id}`,
              item_name: item.name,
              price: item.price,
              quantity: item.quantity,
              merchant_id: merchant.id,
              merchant_name: merchant.name,
            }));
          }
          return [];
        }),
      };

      try {
        if (typeof window.gtag !== "undefined") {
          window.gtag("event", "purchase", transactionData);
          window.gtag("event", "checkout_completed", {
            customer_village: customerInfo.village,
            order_id: orderId,
            order_value: totalAmount,
            item_count: transactionData.items.length,
            merchant_count: merchantsWithItems.filter((m) =>
              isCurrentlyOpen(m.openingHours)
            ).length,
          });
        }
      } catch (error) {
        console.error("Error tracking checkout event:", error);
      }
    };

    trackCheckoutEvent();

    // Encode the message for the URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp with the formatted message
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
      "_blank"
    );

    // Clear the entire cart after checkout
    clearCart();
    navigate("/");
    setIsCheckingOut(false);
  };

  const renderShippingForm = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h2 className="font-bold text-lg mb-4">Informasi Pengiriman</h2>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="name"
        >
          Nama Pemesan <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={customerInfo.name || ""}
          onChange={handleInputChange}
          className={`shadow appearance-none border ${
            formErrors.name ? "border-red-500" : ""
          } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
          placeholder="Masukkan nama Anda"
          aria-required="true"
          aria-invalid={!!formErrors.name}
          aria-describedby={formErrors.name ? "name-error" : undefined}
        />
        {formErrors.name && (
          <p className="text-red-500 text-xs mt-1" id="name-error">
            {formErrors.name}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Kecamatan
        </label>
        <input
          type="text"
          value="Duduksampeyan"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 leading-tight bg-gray-100"
          disabled
          aria-readonly="true"
        />
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="village"
        >
          Desa <span className="text-red-500">*</span>
        </label>
        <select
          id="village"
          name="village"
          value={customerInfo.village || ""}
          onChange={handleInputChange}
          className={`shadow border ${
            formErrors.village ? "border-red-500" : ""
          } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
          aria-required="true"
          aria-invalid={!!formErrors.village}
          aria-describedby={formErrors.village ? "village-error" : undefined}
        >
          <option value="">Pilih Desa</option>
          {VILLAGES.map((village) => (
            <option key={village} value={village}>
              {village}
            </option>
          ))}
        </select>
        {formErrors.village && (
          <p className="text-red-500 text-xs mt-1" id="village-error">
            {formErrors.village}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="addressDetail"
        >
          Detail Alamat <span className="text-red-500">*</span>
        </label>
        <textarea
          id="addressDetail"
          name="addressDetail"
          value={customerInfo.addressDetail || ""}
          onChange={handleInputChange}
          className={`shadow appearance-none border ${
            formErrors.addressDetail ? "border-red-500" : ""
          } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
          placeholder="Masukkan detail alamat (RT/RW, nama gang, warna pagar, dll)"
          rows={3}
          aria-required="true"
          aria-invalid={!!formErrors.addressDetail}
          aria-describedby={
            formErrors.addressDetail ? "address-error" : undefined
          }
        />
        {formErrors.addressDetail && (
          <p className="text-red-500 text-xs mt-1" id="address-error">
            {formErrors.addressDetail}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor="notes"
        >
          Catatan Tambahan
        </label>
        <textarea
          id="notes"
          name="notes"
          value={customerInfo.notes || ""}
          onChange={handleInputChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          placeholder="Catatan tambahan untuk pesanan Anda"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <Header title="Keranjang" showBack />

      <div className="container mx-auto px-4 py-6">
        {isOffline && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 flex items-center">
            <WifiOff size={20} className="mr-2" aria-hidden="true" />
            <span>
              Anda sedang offline. Data yang ditampilkan adalah data terakhir
              yang tersimpan.
            </span>
          </div>
        )}

        {hasClosedMerchants && !cartEmpty && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4 flex items-center">
            <AlertTriangle size={20} className="mr-2" aria-hidden="true" />
            <span>
              Beberapa merchant sedang tutup. Hanya pesanan dari merchant yang
              buka yang akan diproses.
            </span>
          </div>
        )}

        {isLoading ? (
          <>
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 mb-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              </div>

              <CartItemSkeleton />
              <CartItemSkeleton />
            </div>
          </>
        ) : cartEmpty ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ShoppingBag
              size={48}
              className="mx-auto text-gray-400 mb-4"
              aria-hidden="true"
            />
            <h2 className="text-xl font-bold mb-2">Keranjang Kosong</h2>
            <p className="text-gray-600 mb-4">
              Anda belum menambahkan item ke keranjang
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-orange-500 text-white py-2 px-4 rounded-lg font-medium"
            >
              Lihat Merchant
            </button>
          </div>
        ) : (
          <>
            {renderShippingForm()}
            {merchantsWithItems.map((merchant) => {
              const items = getMerchantItems(merchant.id);
              const merchantSubtotal = getMerchantTotal(merchant.id);
              const isOpen = isCurrentlyOpen(merchant.openingHours);

              return (
                <div
                  key={merchant.id}
                  className={`bg-white rounded-lg shadow-md p-4 mb-6 ${
                    isOpen ? "" : "filter grayscale"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <h2 className="font-bold text-lg">{merchant.name}</h2>
                      {!isOpen && (
                        <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full flex items-center">
                          <AlertTriangle
                            size={14}
                            className="mr-1"
                            aria-hidden="true"
                          />
                          Tutup
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/menu/${merchant.id}`)}
                      className="text-orange-500 flex items-center text-sm"
                      aria-label={`Tambah menu dari ${merchant.name}`}
                    >
                      <Plus size={16} className="mr-1" aria-hidden="true" />
                      Tambah Menu
                    </button>
                  </div>

                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      merchantId={merchant.id}
                    />
                  ))}

                  <div className="mt-4 pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span className="font-bold">
                        {formatCurrency(merchantSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {!cartEmpty && subtotal > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm">
                <div className="flex justify-between mb-1">
                  <span>Subtotal</span>
                  <span className="pl-2">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkir</span>
                  <span className="pl-2">{formatCurrency(DELIVERY_FEE)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-600">Total Pesanan:</span>
                <div className="font-bold text-lg">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold"
                disabled={isCheckingOut}
                aria-busy={isCheckingOut}
              >
                {isCheckingOut ? (
                  <span className="flex items-center">
                    <div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                      aria-hidden="true"
                    ></div>
                    Memuat...
                  </span>
                ) : (
                  "Buat Pesanan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
