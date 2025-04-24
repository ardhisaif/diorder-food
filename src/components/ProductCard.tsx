import React, { useEffect, useState } from "react";
import { MenuItem } from "../types";
import { Plus, Minus, Info, Clock } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { Link } from "react-router-dom";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import supabase from "../utils/supabase/client";
import { Merchant } from "../types";
import LazyImage from "./LazyImage";

interface ProductCardProps {
  item: MenuItem;
  merchantId: number;
  merchantName: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  item,
  merchantId,
  merchantName,
}) => {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const { isServiceOpen } = useSettings();
  const quantity = getItemQuantity(item.id);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("merchants")
          .select("*")
          .eq("id", merchantId)
          .single();

        if (error) {
          console.error("Error fetching merchant:", error);
          setMerchant(null);
        } else {
          setMerchant(data);
        }
      } catch (error) {
        console.error("Error fetching merchant data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (navigator.onLine) fetchMerchant();
  }, [merchantId]);

  const isOpen = merchant
    ? isCurrentlyOpen(merchant.openingHours) && isServiceOpen
    : false;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${
        !isOpen ? "grayscale" : ""
      }`}
    >
      <div className="flex">
        <LazyImage
          src={item.image.startsWith("http") ? item.image : "/placeholder.svg"}
          alt={item.name}
          className="w-24 h-24 object-cover"
        />
        <div className="p-3 flex-1">
          <h3 className="font-bold">{item.name}</h3>
          <Link
            to={`/menu/${merchantId}`}
            className="text-sm text-blue-500 flex items-center"
          >
            <Info size={14} className="mr-1" />
            {merchantName}
          </Link>
          <div className="flex justify-between items-center mt-1">
            <span className="font-bold text-orange-500">
              {formatCurrency(item.price)}
            </span>
            {!isOpen ? (
              <div className="text-red-600 text-sm flex items-center">
                <Clock size={14} className="mr-1" />
                <span>Tutup</span>
              </div>
            ) : (
              <div className="flex items-center">
                <>
                  <button
                    onClick={() => removeFromCart(item.id, merchantId)}
                    className={`w-6 h-6 flex items-center justify-center rounded-full ${
                      quantity > 0
                        ? "bg-orange-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                    disabled={isLoading}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="mx-2 font-medium">{quantity}</span>
                </>

                <button
                  onClick={() => addToCart(item, merchantId)}
                  className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full"
                  disabled={isLoading}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
