import React, { useState } from "react";
import { MenuItem } from "../types";
import { X } from "lucide-react";

interface OptionsPopupProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedOptions: {
      level?: { label: string; value: string; extraPrice: number };
      toppings?: { label: string; value: string; extraPrice: number }[];
    }
  ) => void;
}

const OptionsPopup: React.FC<OptionsPopupProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<{
    label: string;
    value: string;
    extraPrice: number;
  } | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<
    { label: string; value: string; extraPrice: number }[]
  >([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotal = () => {
    let total = item.price * quantity;
    if (selectedLevel) {
      total += selectedLevel.extraPrice * quantity;
    }
    selectedToppings.forEach((topping) => {
      total += topping.extraPrice * quantity;
    });
    return total;
  };

  const handleAddToCart = () => {
    if (!selectedLevel) return;
    onAddToCart(item, quantity, {
      level: selectedLevel,
      toppings: selectedToppings.length > 0 ? selectedToppings : undefined,
    });
    onClose();
  };

  const toggleTopping = (topping: {
    label: string;
    value: string;
    extraPrice: number;
  }) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.value === topping.value);
      if (exists) {
        return prev.filter((t) => t.value !== topping.value);
      }
      return [...prev, topping];
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">{item.name}</h3>
          <button onClick={onClose} className="text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {/* Level Selection */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Pilih Level Pedas</h4>
            <div className="grid grid-cols-2 gap-2">
              {item.options
                ?.filter((opt) => opt.value.startsWith("level"))
                .map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedLevel(option)}
                    className={`p-2 border rounded-lg text-sm ${
                      selectedLevel?.value === option.value
                        ? "border-orange-500 bg-orange-50 text-orange-500"
                        : "border-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Toppings Selection */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Pilih Topping (Opsional)</h4>
            <div className="grid grid-cols-2 gap-2">
              {item.options
                ?.filter((opt) => !opt.value.startsWith("level"))
                .map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleTopping(option)}
                    className={`p-2 border rounded-lg text-sm flex justify-between items-center ${
                      selectedToppings.some((t) => t.value === option.value)
                        ? "border-orange-500 bg-orange-50 text-orange-500"
                        : "border-gray-200"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="text-xs">
                      +{formatCurrency(option.extraPrice)}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="mb-4">
            <h4 className="font-medium mb-2">Jumlah</h4>
            <div className="flex items-center">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 flex items-center justify-center border rounded-l-lg"
              >
                -
              </button>
              <div className="flex-1 text-center border-t border-b py-2">
                {quantity}
              </div>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-8 h-8 flex items-center justify-center border rounded-r-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Total and Add to Cart Button */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Total</span>
              <span className="font-bold text-lg">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!selectedLevel}
              className={`w-full py-3 rounded-lg font-bold ${
                selectedLevel
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              Tambah ke Keranjang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsPopup;
