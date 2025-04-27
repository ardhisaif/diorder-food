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
import { CategorySkeleton } from "../components/Skeletons";

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
    let isMounted = true;
    const fetchMerchantAndMenu = async () => {
      try {
        setIsLoading(true);
        await indexedDBService.initDB();

        // Ambil semua menu dari cache
        const cachedMerchants = await indexedDBService.getAll("merchantInfo");
        const cachedMenuItems = await indexedDBService.getAll("menuItems");

        // Filter menu untuk merchant ini
        const filteredMenuItems = cachedMenuItems.filter(
          (item) => item.merchant_id === Number(merchantId)
        );

        // Render data cache langsung
        if (isMounted) {
          if (cachedMerchants.length > 0) {
            const cachedMerchant = cachedMerchants.find(
              (m) => m.id === Number(merchantId)
            );
            if (cachedMerchant) {
              setMerchant(cachedMerchant);
              setIsOpen(isCurrentlyOpen(cachedMerchant.openingHours));
            }
          }
          if (filteredMenuItems.length > 0) {
            const sortedMenu = [...filteredMenuItems].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
            setMenuItems(sortedMenu);
          }
          setIsLoading(false);
        }

        // Fetch data terbaru dari server di background (opsional, untuk update cache)
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
              .eq("merchant_id", Number(merchantId))
              .order("name", { ascending: true }), // Tambahkan order di sini
          ]);

          const { data: merchantData, error: merchantError } = merchantResponse;
          const { data: menuData, error: menuError } = menuResponse;

          if (!merchantError && merchantData && isMounted) {
            setMerchant(merchantData);
            setIsOpen(isCurrentlyOpen(merchantData.openingHours));
            await indexedDBService.update("merchantInfo", merchantData);
          }
          if (!menuError && menuData && isMounted) {
            setMenuItems(menuData);
            await indexedDBService.cacheMenuItems(menuData, Number(merchantId));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchMerchantAndMenu();
    return () => {
      isMounted = false;
    };
  }, [merchantId]);

  // Update isOpen status every minute
  useEffect(() => {
    if (!merchant) return;

    const intervalId = setInterval(() => {
      setIsOpen(isCurrentlyOpen(merchant.openingHours));
    }, 60000);

    return () => clearInterval(intervalId);
  }, [merchant]);

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

  const renderMerchantInfo = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      );
    }

    return (
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <Header title={merchant?.name || "Menu"} showBack />

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

        {renderMerchantInfo()}

        {isLoading ? (
          <>
            <CategorySkeleton />
            <CategorySkeleton />
          </>
        ) : (
          Object.entries(menuByCategory).map(([category, items]) => (
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
          ))
        )}
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
