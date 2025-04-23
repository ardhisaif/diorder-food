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
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import supabase from "../utils/supabase/client";
import { indexedDBService } from "../utils/indexedDB";

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
  const { getItemCount, getSubtotal } = useCart();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const totalItems = getItemCount();
  const totalAmount = useMemo(() => getSubtotal(), [getSubtotal]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await indexedDBService.initDB();
        const cachedMerchants = await indexedDBService.getAll("merchantInfo");
        const cachedMenu = await indexedDBService.getAll("menuItems");

        if (cachedMerchants.length > 0 && cachedMenu.length > 0) {
          setMerchants(cachedMerchants);
          setMenuData(cachedMenu);
        }

        if (navigator.onLine) {
          const { data: merchantsData, error: merchantsError } = await supabase
            .from("merchants")
            .select("*");
          const { data: menuItemsData, error: menuError } = await supabase
            .from("menu")
            .select("*");
          if (merchantsError || menuError) {
            console.error(
              "Error fetching data from Supabase:",
              merchantsError || menuError
            );
            return;
          }
          setMerchants(merchantsData || []);
          setMenuData(menuItemsData || []);
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
        }
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };
    initializeData();
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

  // Sort merchants by open status (avoid mutating original array)
  const sortedMerchants = useMemo(() => {
    return merchants.slice().sort((a, b) => {
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

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <Header title="diorder" />
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
                {sortedMerchants.map((merchant: Merchant) => (
                  <MerchantCard key={merchant.id} merchant={merchant} />
                ))}
              </div>
            </>
          ) : activeTab === "makanan" ? (
            <>
              {filteredMakanan.length === 0 ? (
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
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {filteredMinuman.length === 0 ? (
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
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {totalItems > 0 && totalAmount > 0 && (
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
