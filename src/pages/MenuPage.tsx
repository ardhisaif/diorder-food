import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MenuItem as MenuItemType, Merchant } from "../types";
import MenuItem from "../components/MenuItem";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { ShoppingBag, Clock, WifiOff } from "lucide-react";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import supabase from "../utils/supabase/client";
import { indexedDBService } from "../utils/indexedDB";
import ServiceClosedBanner from "../components/ServiceClosedBanner";

const MenuPage: React.FC = () => {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { getItemCount, getSubtotal } = useCart();
  const { isServiceOpen } = useSettings();
  const navigate = useNavigate();
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
    const fetchMerchantAndMenu = async () => {
      try {
        setIsLoading(true);
        // Initialize IndexedDB
        await indexedDBService.initDB();

        // Prioritaskan data dari IndexedDB
        const cachedMerchants = await indexedDBService.getAll("merchantInfo");
        const cachedMerchant = cachedMerchants.find(
          (m) => m.id === Number(merchantId)
        );

        const cachedMenuItems = await indexedDBService.getMenuItems(
          Number(merchantId)
        );

        // Set data dari cache terlebih dahulu
        if (cachedMerchant) {
          setMerchant(cachedMerchant);
          setIsOpen(isCurrentlyOpen(cachedMerchant.openingHours));
        }

        if (cachedMenuItems.length > 0) {
          setMenuItems(cachedMenuItems);
          setIsLoading(false);
        }

        // Jika online, update cache dengan data terbaru dari server
        if (navigator.onLine) {
          const [merchantResponse, menuResponse] = await Promise.all([
            supabase
              .from("merchants")
              .select("*")
              .eq("id", Number(merchantId))
              .single(),
            supabase
              .from("menu")
              .select("*")
              .eq("merchant_id", Number(merchantId)),
          ]);

          const { data: merchantData, error: merchantError } = merchantResponse;
          const { data: menuData, error: menuError } = menuResponse;

          if (merchantError || menuError) {
            console.error("Error fetching data:", merchantError || menuError);
            setIsLoading(false);
            return;
          }

          if (merchantData) {
            setMerchant(merchantData);
            setIsOpen(isCurrentlyOpen(merchantData.openingHours));
            await indexedDBService.update("merchantInfo", merchantData);
          }

          if (menuData) {
            setMenuItems(menuData);
            await indexedDBService.cacheMenuItems(menuData, Number(merchantId));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerchantAndMenu();
  }, [merchantId]);

  // Update isOpen status every minute
  useEffect(() => {
    if (!merchant) return;

    const intervalId = setInterval(() => {
      setIsOpen(isCurrentlyOpen(merchant.openingHours));
    }, 60000);

    return () => clearInterval(intervalId);
  }, [merchant]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-500 border-solid"></div>
      </div>
    );
  }

  // Group menu items by category
  const menuByCategory: Record<string, MenuItemType[]> = {};
  menuItems.forEach((item) => {
    if (!menuByCategory[item.category]) {
      menuByCategory[item.category] = [];
    }
    menuByCategory[item.category].push(item);
  });

  const itemCount = getItemCount();
  const totalAmount = getSubtotal();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <Header title={merchant?.name || ""} showBack />

      {!isServiceOpen && <ServiceClosedBanner className="mx-4 mt-4" />}

      <div className="container mx-auto px-4 py-6">
        {isOffline && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 flex items-center">
            <WifiOff size={20} className="mr-2" />
            <span>
              Anda sedang offline. Data yang ditampilkan adalah data terakhir
              yang tersimpan.
            </span>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="font-bold text-lg">{merchant?.name}</h2>
          <p className="text-gray-600 text-sm">{merchant?.address}</p>
          <div className="flex items-center mt-2">
            <Clock size={16} className="mr-1" />
            <span className={isOpen ? "text-green-600" : "text-red-600"}>
              {isOpen ? "Buka" : "Tutup"} • {merchant?.openingHours.open} -{" "}
              {merchant?.openingHours?.close}
            </span>
          </div>
        </div>

        {Object.entries(menuByCategory).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-bold mb-3">{category}</h3>
            {items.map((item) => (
              <MenuItem
                key={item.id}
                item={item}
                merchantId={merchant?.id ?? 0}
                isOpen={isOpen && isServiceOpen}
              />
            ))}
          </div>
        ))}
      </div>

      {itemCount > 0 && totalAmount > 0 && isServiceOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto max-w-md">
            <div className="flex justify-between items-center mb-2">
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
                <span>Keranjang ({itemCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
