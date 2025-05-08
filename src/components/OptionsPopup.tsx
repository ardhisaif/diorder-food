import React, { useState } from "react";
import { MenuItem } from "../types";
import { X, Plus, Minus } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 animate-slideUp">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg">{item.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {/* Level Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-800">
              Pilih Level Pedas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.options
                ?.filter((opt) => opt.value.startsWith("level"))
                .map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedLevel(option)}
                    className={`p-3 border rounded-xl text-sm transition-all duration-200 ${
                      selectedLevel?.value === option.value
                        ? "border-orange-500 bg-orange-50 text-orange-500 shadow-sm"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Toppings Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-800">
              Pilih Topping (Opsional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {item.options
                ?.filter((opt) => !opt.value.startsWith("level"))
                .map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleTopping(option)}
                    className={`p-3 border rounded-xl text-sm flex justify-between items-center transition-all duration-200 ${
                      selectedToppings.some((t) => t.value === option.value)
                        ? "border-orange-500 bg-orange-50 text-orange-500 shadow-sm"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <span className="truncate mr-2">{option.label}</span>
                    <span className="text-xs font-medium whitespace-nowrap">
                      +{formatCurrency(option.extraPrice)}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-800">Jumlah</h4>
            <div className="flex items-center justify-center max-w-[200px] mx-auto">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="mx-4 font-medium text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Total and Add to Cart Button */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-800">Total</span>
              <span className="font-bold text-xl text-orange-500">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!selectedLevel}
              className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 ${
                selectedLevel
                  ? "bg-orange-500 text-white hover:bg-orange-600 shadow-md"
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
