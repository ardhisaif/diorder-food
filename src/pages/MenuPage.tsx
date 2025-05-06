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
import {
  shouldFetchMerchantData,
  updateMerchantTimestamp,
  getLastFetchTime,
  updateLastFetchTime,
} from "../utils/cacheUtils";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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

        // Get all menu from cache
        const cachedMerchants = await indexedDBService.getAll("merchantInfo");
        const cachedMenuItems = await indexedDBService.getAll("menuItems");

        // Filter menu for this merchant
        const filteredMenuItems = cachedMenuItems.filter(
          (item) => item.merchant_id === Number(merchantId)
        );

        // Check if we have sufficient data in the cache
        const hasCachedMerchant = cachedMerchants.some(
          (m) => m.id === Number(merchantId)
        );
        const hasCachedMenuItems = filteredMenuItems.length > 0;
        const hasCompleteData = hasCachedMerchant && hasCachedMenuItems;

        // Render cache data directly
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
        }

        // If we have complete data, reduce loading time
        if (hasCompleteData) {
          setIsLoading(false);
        }

        // Check if we should do a timestamp check
        const lastFetchTime = getLastFetchTime(Number(merchantId));
        const shouldCheckTimestamp =
          !lastFetchTime || Date.now() - lastFetchTime > CACHE_DURATION;

        // Only check for updates if we're online and it's time to check
        if (navigator.onLine && (shouldCheckTimestamp || !hasCompleteData)) {
          // Do a lightweight check for updated_at timestamp before fetching full data
          const { data: merchantTimestampData } = await supabase
            .from("merchants")
            .select("updated_at")
            .eq("id", Number(merchantId))
            .single();

          const serverTimestamp = merchantTimestampData?.updated_at;
          const shouldFetch = shouldFetchMerchantData(
            Number(merchantId),
            serverTimestamp
          );

          // Update the last fetch time regardless of whether we fetch or not
          updateLastFetchTime(Number(merchantId));

          // Only fetch from server if data is missing from cache or if timestamp indicates fresh data
          if (shouldFetch || !hasCompleteData) {
            // console.log("Fetching fresh merchant data based on updated timestamp");

            // Fetch missing data from server
            const fetchPromises = [];

            if (!hasCachedMerchant || shouldFetch) {
              fetchPromises.push(
                supabase
                  .from("merchants")
                  .select("*")
                  .eq("id", Number(merchantId))
                  .single()
              );
            }

            if (!hasCachedMenuItems || shouldFetch) {
              fetchPromises.push(
                supabase
                  .from("menu")
                  .select("*")
                  .eq("merchant_id", Number(merchantId))
                  .order("name", { ascending: true })
              );
            }

            if (fetchPromises.length > 0) {
              const responses = await Promise.all(fetchPromises);

              // Process merchant response if we fetched it
              if ((!hasCachedMerchant || shouldFetch) && responses[0]) {
                const { data: merchantData, error: merchantError } =
                  responses[0];
                if (!merchantError && merchantData && isMounted) {
                  setMerchant(merchantData);
                  setIsOpen(isCurrentlyOpen(merchantData.openingHours));
                  await indexedDBService.update("merchantInfo", merchantData);

                  // Update the merchant timestamp
                  if (merchantData.updated_at) {
                    updateMerchantTimestamp(
                      Number(merchantId),
                      merchantData.updated_at
                    );
                  }
                }
              }

              // Process menu response if we fetched it
              const menuResponseIndex =
                !hasCachedMerchant || shouldFetch ? 1 : 0;
              if (
                (!hasCachedMenuItems || shouldFetch) &&
                responses[menuResponseIndex]
              ) {
                const { data: menuData, error: menuError } =
                  responses[menuResponseIndex];
                if (!menuError && menuData && isMounted) {
                  setMenuItems(menuData);
                  await indexedDBService.cacheMenuItems(
                    menuData,
                    Number(merchantId)
                  );
                }
              }
            }
          }
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch {
        // console.error("Error fetching data:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchMerchantAndMenu();
    return () => {
      isMounted = false;
    };
  }, [merchantId]);

  // Add real-time subscriptions for the specific merchant and its menu items
  useEffect(() => {
    if (!merchantId) return;

    // Set up real-time subscription to the specific merchant
    const merchantSubscription = supabase
      .channel(`merchant_${merchantId}_changes`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "merchants",
          filter: `id=eq.${merchantId}`,
        },
        async (payload) => {
          const updatedMerchant = payload.new as Merchant;

          // Update IndexedDB
          await indexedDBService.update("merchantInfo", updatedMerchant);

          // Update state
          setMerchant(updatedMerchant);

          // Update isOpen status
          setIsOpen(isCurrentlyOpen(updatedMerchant.openingHours));

          // Update merchant timestamp
          if (updatedMerchant.updated_at) {
            updateMerchantTimestamp(
              Number(merchantId),
              updatedMerchant.updated_at
            );
          }
        }
      )
      .subscribe();

    // Set up real-time subscription to menu items for this merchant
    const menuSubscription = supabase
      .channel(`menu_${merchantId}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "menu",
          filter: `merchant_id=eq.${merchantId}`,
        },
        async (payload) => {
          // Handle menu item changes
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            const updatedMenuItem = payload.new as MenuItemType;

            // Update state by replacing the item or adding it if it's new
            setMenuItems((prevItems) => {
              const index = prevItems.findIndex(
                (item) => item.id === updatedMenuItem.id
              );
              if (index >= 0) {
                const newItems = [...prevItems];
                newItems[index] = updatedMenuItem;
                return newItems;
              } else {
                return [...prevItems, updatedMenuItem];
              }
            });

            // Update IndexedDB
            await indexedDBService.update("menuItems", updatedMenuItem);
          } else if (payload.eventType === "DELETE") {
            const deletedMenuItemId = payload.old.id;

            // Remove from state
            setMenuItems((prevItems) =>
              prevItems.filter((item) => item.id !== deletedMenuItemId)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions when component unmounts or merchantId changes
    return () => {
      merchantSubscription.unsubscribe();
      menuSubscription.unsubscribe();
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
