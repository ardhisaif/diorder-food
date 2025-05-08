import React, { useState } from "react";
import { MenuItem as MenuItemType } from "../types";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { Plus, Minus, Clock } from "lucide-react";
import LazyImage from "./LazyImage";
import OptionsPopup from "./OptionsPopup";

interface MenuItemProps {
  item: MenuItemType;
  merchantId: number;
  isOpen: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, merchantId, isOpen }) => {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const { isServiceOpen } = useSettings();
  const quantity = getItemQuantity(item.id);
  const [showOptions, setShowOptions] = useState(false);

  // Combined status - both merchant must be open and overall service must be open
  const isAvailable = isOpen && isServiceOpen;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddToCart = (
    item: MenuItemType,
    quantity: number,
    selectedOptions: {
      level?: { label: string; value: string; extraPrice: number };
      toppings?: { label: string; value: string; extraPrice: number }[];
    }
  ) => {
    addToCart({ ...item, selectedOptions }, merchantId, quantity);
  };

  return (
    <>
      <div
        className={`bg-white rounded-lg shadow-md overflow-hidden mb-4 ${
          !isAvailable ? "grayscale" : ""
        }`}
      >
        <div className="flex">
          <LazyImage
            src={
              item.image.startsWith("http") ? item.image : "/placeholder.svg"
            }
            alt=""
            className="w-24 h-24 object-cover"
          />
          <div className="p-3 flex-1">
            <h3 className="font-bold">{item.name}</h3>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-orange-500">
                {formatCurrency(item.price)}
              </span>
              {!isOpen ? (
                <div className="text-red-600 text-sm flex items-center">
                  <Clock size={14} className="mr-1" />
                  <span>Tutup</span>
                </div>
              ) : !isServiceOpen ? (
                <div className="text-red-600 text-sm flex items-center">
                  <Clock size={14} className="mr-1" />
                  <span>Layanan Tutup</span>
                </div>
              ) : (
                <div className="flex items-center">
                  {item.options ? (
                    <button
                      onClick={() => setShowOptions(true)}
                      className="bg-orange-500 text-white px-4 py-1 rounded-lg text-sm"
                    >
                      {quantity > 0 ? `${quantity} item` : "Pesan"}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => removeFromCart(item.id, merchantId)}
                        className={`w-6 h-6 flex items-center justify-center rounded-full ${
                          quantity > 0
                            ? "bg-orange-500 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="mx-2 font-medium">{quantity}</span>
                      <button
                        onClick={() => addToCart(item, merchantId)}
                        className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full"
                      >
                        <Plus size={14} />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showOptions && (
        <OptionsPopup
          item={item}
          onClose={() => setShowOptions(false)}
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
};

export default MenuItem;
