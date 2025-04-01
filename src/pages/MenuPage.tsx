import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MenuItem as MenuItemType, Merchant } from "../types";
import MenuItem from "../components/MenuItem";
import Header from "../components/Header";
import { useCart } from "../context/CartContext";
import { ShoppingBag, Clock } from "lucide-react";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import supabase from "../utils/supabase/client"; // Import Supabase client

const MenuPage: React.FC = () => {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { getItemCount, getSubtotal } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMerchantAndMenu = async () => {
      const { data: merchantData, error: merchantError } = await supabase
        .from("merchants")
        .select("*")
        .eq("id", Number(merchantId))
        .single();

      const { data: menuData, error: menuError } = await supabase
        .from("menu")
        .select("*")
        .eq("merchant_id", Number(merchantId));

      if (merchantError || menuError) {
        console.error(
          "Error fetching data from Supabase:",
          merchantError || menuError
        );
        return;
      }

      setMerchant(merchantData || null);
      setMenuItems(menuData || []);
      setIsOpen(
        merchantData ? isCurrentlyOpen(merchantData.openingHours) : false
      );
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

  if (!merchant) {
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
      <Header title={merchant.name} showBack />

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="font-bold text-lg">{merchant.name}</h2>
          <p className="text-gray-600 text-sm">{merchant.address}</p>
          <div className="flex items-center mt-2">
            <Clock size={16} className="mr-1" />
            <span className={isOpen ? "text-green-600" : "text-red-600"}>
              {isOpen ? "Buka" : "Tutup"} • {merchant.openingHours.open} -{" "}
              {merchant.openingHours.close}
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
                merchantId={merchant.id}
                isOpen={isOpen}
              />
            ))}
          </div>
        ))}
      </div>

      {itemCount > 0 && totalAmount > 0 && (
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
