import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Merchant, MenuItem } from "../types";
import MerchantCard from "../components/MerchantCard";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import merchants from "../data/merchants.json";
import menuData from "../data/menu.json";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { isCurrentlyOpen } from "../utils/merchantUtils";

// Fungsi untuk format mata uang, dipindahkan ke luar agar tidak dideklarasikan ulang
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredProducts, setFilteredProducts] =
    useState<MenuItem[]>(menuData);
  const [activeTab, setActiveTab] = useState<"merchants" | "products">(
    "merchants"
  );
  const { getMerchantItems, getSubtotal } = useCart();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Menggunakan useMemo agar total items tidak dihitung ulang pada setiap render
  const totalItems = useMemo(() => {
    return merchants.reduce((sum, merchant) => {
      const items = getMerchantItems(merchant.id);
      return sum + items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
  }, [getMerchantItems]);

  const totalAmount = useMemo(() => getSubtotal(), [getSubtotal]);

  // Callback untuk menangani pencarian, memastikan fungsi tidak berubah di setiap render
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredProducts(menuData);
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const results = menuData.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery)
    );

    setFilteredProducts(results);
  }, []);

  // Find merchant name by id
  const getMerchantName = useCallback((merchantId: number): string => {
    const merchant = merchants.find((m) => m.id === merchantId);
    return merchant ? merchant.name : "";
  }, []);

  // Sort merchants by open status
  const sortedMerchants = useMemo(() => {
    return merchants.sort((a, b) => {
      const isOpenA = isCurrentlyOpen(a.openingHours);
      const isOpenB = isCurrentlyOpen(b.openingHours);
      return isOpenA === isOpenB ? 0 : isOpenA ? -1 : 1;
    });
  }, []);

  // Sort products by merchant open status
  const sortedProducts = useMemo(() => {
    return filteredProducts.sort((a, b) => {
      const merchantA = merchants.find((m) => m.id === a.merchant_id);
      const merchantB = merchants.find((m) => m.id === b.merchant_id);
      const isOpenA = merchantA
        ? isCurrentlyOpen(merchantA.openingHours)
        : false;
      const isOpenB = merchantB
        ? isCurrentlyOpen(merchantB.openingHours)
        : false;
      return isOpenA === isOpenB ? 0 : isOpenA ? -1 : 1;
    });
  }, [filteredProducts]);

  // Update filteredProducts when searchQuery changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(menuData);
    }
  }, [searchQuery]);

  const handleSwipe = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const startX = touch.clientX;
    const handleTouchEnd = (endEvent: TouchEvent) => {
      const endX = endEvent.changedTouches[0].clientX;
      if (startX - endX > 50) {
        setActiveTab("products");
      } else if (endX - startX > 50) {
        setActiveTab("merchants");
      }
      containerRef.current?.removeEventListener("touchend", handleTouchEnd);
    };
    containerRef.current?.addEventListener("touchend", handleTouchEnd);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    container?.addEventListener("touchstart", handleSwipe);
    return () => {
      container?.removeEventListener("touchstart", handleSwipe);
    };
  }, [handleSwipe]);

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-100 pb-24">
      <Header title="Diorderin" />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-center mb-4 space-x-4">
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 transform ${
              activeTab === "merchants"
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("merchants")}
          >
            Merchants
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 transform ${
              activeTab === "products"
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("products")}
          >
            Products
          </button>
        </div>

        {activeTab === "products" && <SearchBar onSearch={handleSearch} />}

        {activeTab === "merchants" ? (
          <>
            <h2 className="text-xl font-bold mb-4">Daftar Merchant</h2>
            <div className="grid gap-4">
              {sortedMerchants.map((merchant: Merchant) => (
                <MerchantCard key={merchant.id} merchant={merchant} />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* <h2 className="text-xl font-bold mb-4">
              Hasil Pencarian: "{searchQuery}"
            </h2> */}
            {sortedProducts.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <p>Tidak ada produk yang ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    item={product}
                    merchantId={product.merchant_id}
                    merchantName={getMerchantName(product.merchant_id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto max-w-md">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-gray-600">Total Pesanan:</div>
                <div className="font-bold text-lg">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              <button
                onClick={() => navigate("/cart")}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold flex items-center"
              >
                <ShoppingBag className="mr-2" size={20} />
                <span>Keranjang ({totalItems})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
