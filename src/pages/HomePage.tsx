import React, { useState, useMemo, useCallback } from "react";
import { Merchant, MenuItem } from "../types";
import MerchantCard from "../components/MerchantCard";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import merchants from "../data/merchants.json";
import menuData from "../data/menu.json";
import { Store, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

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
  const [filteredProducts, setFilteredProducts] = useState<MenuItem[]>([]);
  const { getMerchantItems, getSubtotal } = useCart();
  const navigate = useNavigate();

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
      setFilteredProducts([]);
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
  const getMerchantName = useCallback(
    (merchantId: number): string => {
      const merchant = merchants.find((m) => m.id === merchantId);
      return merchant ? merchant.name : "";
    },
    []
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <Header title="Diorderin" />
      <main className="container mx-auto px-4 py-6">
        <SearchBar onSearch={handleSearch} />

        {filteredProducts.length === 0 ? (
          <>
            {/* <div className="bg-orange-100 rounded-lg p-4 mb-6 flex items-center">
              <Store size={26} className="text-orange-500 mr-3" />
              <div>
                <h2 className="font-bold text-lg">Pesan Makanan Online</h2>
                <p className="text-sm text-gray-600">
                  Pilih merchant favorit dan pesan langsung via WhatsApp
                </p>
              </div>
            </div> */}
            <h2 className="text-xl font-bold mb-4">Daftar Merchant</h2>
            <div className="grid gap-4">
              {merchants.map((merchant: Merchant) => (
                <MerchantCard key={merchant.id} merchant={merchant} />
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">
              Hasil Pencarian: "{searchQuery}"
            </h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <p>Tidak ada produk yang ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredProducts.map((product) => (
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
