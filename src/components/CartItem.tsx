import React from "react";
import { CartItem as CartItemType } from "../types";
import { useCart } from "../context/CartContext";
import { Plus, Minus } from "lucide-react";
import LazyImage from "./LazyImage";

interface CartItemProps {
  item: CartItemType;
  merchantId: number;
}

const CartItem: React.FC<CartItemProps> = ({ item, merchantId }) => {
  const { updateQuantity, updateItemNotes } = useCart();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateItemNotes(item.id, e.target.value, merchantId);
  };

  const decreaseQuantity = () => {
    updateQuantity(item.id, item.quantity - 1, merchantId);
  };

  const increaseQuantity = () => {
    updateQuantity(item.id, item.quantity + 1, merchantId);
  };

  return (
    <div className="flex flex-row items-start py-4 border-b">
      <div className="relative w-20 h-20 min-w-20 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center self-center">
        <LazyImage
          src={item.image.startsWith("http") ? item.image : "/placeholder.svg"}
          alt={`Image of ${item.name}`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="ml-4 flex-1 w-full">
        <h3 className="font-medium">{item.name}</h3>
        <div className="flex flex-row items-center justify-between mt-2 gap-2">
          <div className="text-orange-500 font-bold">
            {formatCurrency(item.price)}
          </div>
          <div className="flex items-center">
            <button
              onClick={decreaseQuantity}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
            >
              <Minus size={16} />
            </button>
            <span className="mx-3 w-6 text-center font-medium">
              {item.quantity}
            </span>
            <button
              onClick={increaseQuantity}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-700">
          Subtotal:{" "}
          <span className="font-medium">
            {formatCurrency(item.price * item.quantity)}
          </span>
        </div>
        <div className="mt-2">
          <label htmlFor={`notes-${item.id}`} className="sr-only">
            Catatan untuk {item.name}
          </label>
          <textarea
            id={`notes-${item.id}`}
            value={item.notes}
            onChange={handleNotesChange}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm"
            placeholder="Catatan tambahan untuk produk ini"
            rows={2}
            aria-label={`Notes for ${item.name}`}
          />
        </div>
      </div>
    </div>
  );
};

export default CartItem;
