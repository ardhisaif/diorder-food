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
  const { updateQuantity } = useCart();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateItemTotal = () => {
    let total = item.price * item.quantity;

    // Add level price if exists
    if (item.selectedOptions?.level) {
      total += item.selectedOptions.level.extraPrice * item.quantity;
    }

    // Add toppings price if exists
    if (item.selectedOptions?.toppings) {
      item.selectedOptions.toppings.forEach((topping) => {
        total += topping.extraPrice * item.quantity;
      });
    }

    return total;
  };

  const renderPriceBreakdown = () => {
    const breakdown = [];

    // Base price
    breakdown.push(
      <div key="base" className="flex justify-between text-sm">
        <span>Harga Dasar</span>
        <span>{formatCurrency(item.price)}</span>
      </div>
    );

    // Level price if exists
    if (item.selectedOptions?.level) {
      breakdown.push(
        <div key="level" className="flex justify-between text-sm">
          <span>{item.selectedOptions.level.label}</span>
          <span>{formatCurrency(item.selectedOptions.level.extraPrice)}</span>
        </div>
      );
    }

    // Toppings prices if exist
    if (item.selectedOptions?.toppings) {
      item.selectedOptions.toppings.forEach((topping, index) => {
        breakdown.push(
          <div
            key={`topping-${index}`}
            className="flex justify-between text-sm"
          >
            <span>+ {topping.label}</span>
            <span>{formatCurrency(topping.extraPrice)}</span>
          </div>
        );
      });
    }

    // Subtotal per item
    const subtotalPerItem =
      item.price +
      (item.selectedOptions?.level?.extraPrice || 0) +
      (item.selectedOptions?.toppings?.reduce(
        (sum, t) => sum + t.extraPrice,
        0
      ) || 0);

    breakdown.push(
      <div
        key="subtotal"
        className="flex justify-between text-sm font-medium mt-1 pt-1 border-t"
      >
        <span>Subtotal per item</span>
        <span>{formatCurrency(subtotalPerItem)}</span>
      </div>
    );

    // Total for all items
    breakdown.push(
      <div key="total" className="flex justify-between text-sm font-bold mt-1">
        <span>Total ({item.quantity} item)</span>
        <span>{formatCurrency(calculateItemTotal())}</span>
      </div>
    );

    return breakdown;
  };

  return (
    <div className="flex items-center py-3 border-b">
      <LazyImage
        src={item.image.startsWith("http") ? item.image : "/placeholder.svg"}
        alt=""
        className="w-16 h-16 object-cover rounded-lg"
      />
      <div className="ml-3 flex-1">
        <h3 className="font-medium">{item.name}</h3>

        {/* Display selected options */}
        {item.selectedOptions && (
          <div className="text-sm text-gray-600 mt-1">
            {item.selectedOptions.level && (
              <div>{item.selectedOptions.level.label}</div>
            )}
            {item.selectedOptions.toppings &&
              item.selectedOptions.toppings.length > 0 && (
                <div className="text-xs">
                  Topping:{" "}
                  {item.selectedOptions.toppings.map((t) => t.label).join(", ")}
                </div>
              )}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="mt-2 text-gray-600">{renderPriceBreakdown()}</div>

        <div className="flex justify-end items-center mt-2">
          <button
            onClick={() =>
              updateQuantity(item.id, item.quantity - 1, merchantId)
            }
            className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white"
          >
            <Minus size={14} />
          </button>
          <span className="mx-2 font-medium">{item.quantity}</span>
          <button
            onClick={() =>
              updateQuantity(item.id, item.quantity + 1, merchantId)
            }
            className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
