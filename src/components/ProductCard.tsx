import React from "react";
import { MenuItem } from "../types";
import { Plus, Minus, Info, Clock } from "lucide-react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import merchantsData from "../data/merchants.json";

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
  const quantity = getItemQuantity(item.id);
  const merchant = merchantsData.find(m => m.id === merchantId);
  const isOpen = merchant ? isCurrentlyOpen(merchant.openingHours) : false;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${!isOpen ? 'grayscale' : ''}`}>
      <div className="flex">
        <img
          src={item.image}
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
                  >
                    <Minus size={14} />
                  </button>
                  <span className="mx-2 font-medium">{quantity}</span>
                </>
                
                <button
                  onClick={() => addToCart(item, merchantId)}
                  className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full"
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