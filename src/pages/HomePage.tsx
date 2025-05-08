import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  TouchEvent,
} from "react";
import { Merchant, MenuItem } from "../types";
import MerchantCardOrig from "../components/MerchantCard";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import ProductCardOrig from "../components/ProductCard";
import { ShoppingBag, WifiOff } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useNavigate } from "react-router-dom";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import supabase from "../utils/supabase/client";
import { indexedDBService } from "../utils/indexedDB";
import ServiceClosedBanner from "../components/ServiceClosedBanner";
import { MerchantSkeleton, ProductSkeleton } from "../components/Skeletons";
import {
  shouldFetchFreshData,
  updateStoredTimestamp,
  TIMESTAMP_KEYS,
} from "../utils/cacheUtils";
// import { getLastFetchTime, updateLastFetchTime } from "../utils/cacheUtils";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
const HOME_LAST_FETCH_KEY = "diorder_home_last_fetch";

// Memoized components
const MerchantCard = React.memo(MerchantCardOrig);
const ProductCard = React.memo(ProductCardOrig);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "merchants" | "makanan" | "minuman"
  >("merchants");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const { getItemCount, getSubtotal } = useCart();
  const { isServiceOpen, refreshServiceStatus } = useSettings();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const totalItems = getItemCount();
  const totalAmount = useMemo(() => getSubtotal(), [getSubtotal]);

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
    const initializeData = async () => {
      try {
        setIsLoading(true);
        await indexedDBService.initDB();
        const cachedMerchants = await indexedDBService.getAll("merchantInfo");
        const cachedMenu = await indexedDBService.getAll("menuItems");

        // Check if we have sufficient data in the cache
        const hasCachedData =
          cachedMerchants.length > 0 && cachedMenu.length > 0;

        if (hasCachedData) {
          // Use cached data
          setMerchants(cachedMerchants);
          setMenuData(cachedMenu);
          setIsLoading(false);
        }

        // Check if we should do a timestamp check based on time since last fetch
        const lastFetchTime = localStorage.getItem(HOME_LAST_FETCH_KEY);
        const shouldCheckTimestamp =
          !lastFetchTime ||
          Date.now() - parseInt(lastFetchTime) > CACHE_DURATION;

        // Only check for updates if we're online and it's time to check or no cached data
        if (navigator.onLine && (shouldCheckTimestamp || !hasCachedData)) {
          // Do a lightweight check for updated_at timestamp before fetching full data
          const { data: settingsData } = await supabase
            .from("settings")
            .select("updated_at")
            .single();

          const serverTimestamp = settingsData?.updated_at;
          const shouldFetch = shouldFetchFreshData(
            TIMESTAMP_KEYS.SETTINGS,
            serverTimestamp
          );

          // Update the last fetch time regardless of whether we fetch or not
          localStorage.setItem(HOME_LAST_FETCH_KEY, Date.now().toString());

          // Only fetch from server if needed based on timestamp or missing cache
          if (shouldFetch || !hasCachedData) {
            // console.log("Fetching fresh data from server based on updated timestamp");

            const { data: merchantsData, error: merchantsError } =
              await supabase.from("merchants").select("*");
            const { data: menuItemsData, error: menuError } = await supabase
              .from("menu")
              .select("*")
              .eq("is_active", true);

            if (merchantsError || menuError) {
              // console.error(
              //   "Error fetching data from Supabase:",
              //   merchantsError || menuError
              // );
              if (!hasCachedData) {
                // Only set loading to false if we didn't already show cached data
                setIsLoading(false);
              }
              return;
            }

            // Update state with fresh data
            setMerchants(merchantsData || []);
            setMenuData(menuItemsData || []);

            // Update cache in IndexedDB
            if (merchantsData) {
              for (const merchant of merchantsData) {
                await indexedDBService.update("merchantInfo", merchant);
              }
            }
            if (menuItemsData) {
              for (const menuItem of menuItemsData) {
                await indexedDBService.update("menuItems", menuItem);
              }
            }

            // Store the latest timestamp for future comparison
            if (serverTimestamp) {
              updateStoredTimestamp(TIMESTAMP_KEYS.SETTINGS, serverTimestamp);
            }
          } else {
            // console.log("Using cached data - server data hasn't changed");
          }
        }
      } catch {
        // console.error("Error initializing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Add real-time subscriptions for merchants and menu data
  useEffect(() => {
    // Set up real-time subscription to merchants table
    const merchantsSubscription = supabase
      .channel("merchants_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "merchants" },
        async (payload) => {
          // Handle merchant updates
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            const updatedMerchant = payload.new as Merchant;

            // Update IndexedDB
            await indexedDBService.update("merchantInfo", updatedMerchant);

            // Update state by replacing the merchant or adding it if it's new
            setMerchants((prevMerchants) => {
              const index = prevMerchants.findIndex(
                (m) => m.id === updatedMerchant.id
              );
              if (index >= 0) {
                const newMerchants = [...prevMerchants];
                newMerchants[index] = updatedMerchant;
                return newMerchants;
              } else {
                return [...prevMerchants, updatedMerchant];
              }
            });
          } else if (payload.eventType === "DELETE") {
            const deletedMerchantId = payload.old.id;

            // Remove from state
            setMerchants((prevMerchants) =>
              prevMerchants.filter((m) => m.id !== deletedMerchantId)
            );
          }
        }
      )
      .subscribe();

    // Set up real-time subscription to menu table
    const menuSubscription = supabase
      .channel("menu_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu" },
        async (payload) => {
          // Handle menu item updates
          if (
            payload.eventType === "UPDATE" ||
            payload.eventType === "INSERT"
          ) {
            const updatedMenuItem = payload.new as MenuItem;

            // Update IndexedDB
            await indexedDBService.update("menuItems", updatedMenuItem);

            // Update state
            setMenuData((prevMenuItems) => {
              const index = prevMenuItems.findIndex(
                (item) => item.id === updatedMenuItem.id
              );
              if (index >= 0) {
                const newMenuItems = [...prevMenuItems];
                newMenuItems[index] = updatedMenuItem;
                return newMenuItems;
              } else {
                return [...prevMenuItems, updatedMenuItem];
              }
            });
          } else if (payload.eventType === "DELETE") {
            const deletedMenuItemId = payload.old.id;

            // Remove from state
            setMenuData((prevMenuItems) =>
              prevMenuItems.filter((item) => item.id !== deletedMenuItemId)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions when component unmounts
    return () => {
      merchantsSubscription.unsubscribe();
      menuSubscription.unsubscribe();
    };
  }, []);

  // Filtered products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return menuData;
    const normalizedQuery = searchQuery.toLowerCase();
    return menuData.filter(
      (item) =>
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.category.toLowerCase().includes(normalizedQuery)
    );
  }, [menuData, searchQuery]);

  // Find merchant name by id
  const getMerchantName = useCallback(
    (merchantId: number): string => {
      const merchant = merchants.find((m) => m.id === merchantId);
      return merchant ? merchant.name : "";
    },
    [merchants]
  );

  // Add this function to determine if a merchant is open
  const isMerchantOpen = useCallback(
    (merchantId: number): boolean => {
      const merchant = merchants.find((m) => m.id === merchantId);
      return merchant
        ? isCurrentlyOpen(merchant.openingHours) && isServiceOpen
        : false;
    },
    [merchants, isServiceOpen]
  );

  // Sort merchants by open status (avoid mutating original array)
  const sortedMerchants = useMemo(() => {
    // Urutkan berdasarkan nama (A-Z) lebih dulu
    const byName = merchants
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    // Lalu urutkan berdasarkan status buka/tutup (buka di atas)
    return byName.sort((a, b) => {
      const isOpenA = a.openingHours ? isCurrentlyOpen(a.openingHours) : false;
      const isOpenB = b.openingHours ? isCurrentlyOpen(b.openingHours) : false;
      return isOpenA === isOpenB ? 0 : isOpenA ? -1 : 1;
    });
  }, [merchants]);

  // Sort products by merchant open status (avoid mutating original array)
  const sortProductsByMerchantOpenStatus = useCallback(
    (products: MenuItem[]) => {
      return products.slice().sort((a, b) => {
        const merchantA = merchants.find((m) => m.id === a.merchant_id);
        const merchantB = merchants.find((m) => m.id === b.merchant_id);
        const isOpenA = merchantA?.openingHours
          ? isCurrentlyOpen(merchantA.openingHours)
          : false;
        const isOpenB = merchantB?.openingHours
          ? isCurrentlyOpen(merchantB.openingHours)
          : false;
        return isOpenA === isOpenB ? 0 : isOpenA ? -1 : 1;
      });
    },
    [merchants]
  );

  // Filter and sort products by category
  const filteredMakanan = useMemo(() => {
    const makanan = filteredProducts.filter(
      (item) => item.category.toLowerCase() === "makanan"
    );
    return sortProductsByMerchantOpenStatus(makanan);
  }, [filteredProducts, sortProductsByMerchantOpenStatus]);

  const filteredMinuman = useMemo(() => {
    const minuman = filteredProducts.filter(
      (item) => item.category.toLowerCase() === "minuman"
    );
    return sortProductsByMerchantOpenStatus(minuman);
  }, [filteredProducts, sortProductsByMerchantOpenStatus]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      if (activeTab === "merchants") setActiveTab("makanan");
      else if (activeTab === "makanan") setActiveTab("minuman");
    } else if (isRightSwipe) {
      if (activeTab === "minuman") setActiveTab("makanan");
      else if (activeTab === "makanan") setActiveTab("merchants");
    }
    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, activeTab]);

  // Handler untuk tombol keranjang
  const handleCartClick = useCallback(async () => {
    const open = await refreshServiceStatus();
    if (!open) {
      return;
    }
    navigate("/cart");
  }, [refreshServiceStatus, navigate]);

  // Handler untuk klik merchant card (lihat menu)
  const handleMerchantMenuClick = useCallback(
    async (merchantId: number) => {
      const open = await refreshServiceStatus();
      if (!open) {
        return;
      }
      navigate(`/menu/${merchantId}`);
    },
    [refreshServiceStatus, navigate]
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <Header title="diorder" />
      {!isServiceOpen && <ServiceClosedBanner className="mx-4 mt-4" />}
      {isOffline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mx-4 mt-4 flex items-center">
          <WifiOff size={20} className="mr-2" />
          <span>
            Anda sedang offline. Data yang ditampilkan adalah data terakhir yang
            tersimpan.
          </span>
        </div>
      )}
      <main
        className="container mx-auto px-4 py-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center mb-4 space-x-2 sm:space-x-4">
          <button
            className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all duration-300 transform ${
              activeTab === "merchants"
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("merchants")}
          >
            Resto
          </button>
          <button
            className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all duration-300 transform ${
              activeTab === "makanan"
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("makanan")}
          >
            Makanan
          </button>
          <button
            className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all duration-300 transform ${
              activeTab === "minuman"
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("minuman")}
          >
            Minuman
          </button>
        </div>

        <div className="transition-opacity duration-300">
          {(activeTab === "makanan" || activeTab === "minuman") && (
            <SearchBar
              onSearch={handleSearch}
              placeholder={`Cari ${
                activeTab === "makanan" ? "makanan" : "minuman"
              }...`}
            />
          )}

          {activeTab === "merchants" ? (
            <>
              <h2 className="text-xl font-bold mb-4">Daftar Resto</h2>
              <div className="grid gap-4">
                {isLoading
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => <MerchantSkeleton key={i} />)
                  : sortedMerchants.map((merchant: Merchant, index) => (
                      <div
                        key={merchant.id}
                        onClick={() => handleMerchantMenuClick(merchant.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <MerchantCard
                          merchant={merchant}
                          priority={index < 2} // Only make the first 2 merchant images high priority
                          isServiceOpen={isServiceOpen}
                        />
                      </div>
                    ))}
              </div>
            </>
          ) : activeTab === "makanan" ? (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                </div>
              ) : filteredMakanan.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                  <p>Tidak ada makanan yang ditemukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredMakanan.map((product) => (
                    <ProductCard
                      key={product.id}
                      item={product}
                      merchantId={product.merchant_id}
                      merchantName={getMerchantName(product.merchant_id)}
                      isOpen={isMerchantOpen(product.merchant_id)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))}
                </div>
              ) : filteredMinuman.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                  <p>Tidak ada minuman yang ditemukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredMinuman.map((product) => (
                    <ProductCard
                      key={product.id}
                      item={product}
                      merchantId={product.merchant_id}
                      merchantName={getMerchantName(product.merchant_id)}
                      isOpen={isMerchantOpen(product.merchant_id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {totalItems > 0 && totalAmount > 0 && isServiceOpen && (
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
                onClick={handleCartClick}
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
