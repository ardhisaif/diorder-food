import React, { useState } from "react";
import { MenuItem } from "../types";
import { X, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";

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
  const [showAllToppings, setShowAllToppings] = useState(false);

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

  const spiceLevels =
    item.options?.filter((opt) => opt.value.startsWith("level")) || [];
  const toppings =
    item.options?.filter((opt) => !opt.value.startsWith("level")) || [];
  const initialToppings = toppings.slice(0, 3);
  const remainingToppings = toppings.slice(3);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 animate-slideUp">
        <div className="p-4 border-b flex justify-between items-center">
          {/* <h3 className="font-bold text-lg">{item.name}</h3> */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 max-h-[80vh] overflow-y-auto">
          {/* Product Info Layout */}
          <div className="flex gap-4 mb-6 items-center">
            {/* Product Image */}
            <img
              src={
                item.image?.startsWith("http") ? item.image : "/placeholder.svg"
              }
              alt={item.name}
              className="w-20 h-20 object-cover rounded-lg border bg-gray-100 flex-shrink-0"
            />
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base sm:text-lg text-black truncate">
                {item.name}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-orange-500 text-lg">
                  {formatCurrency(item.price)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-6 h-6 flex items-center justify-center border border-orange-400 text-orange-500 rounded-full transition-colors hover:bg-orange-50"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="mx-2 font-medium text-base w-4 text-center select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-orange-500 text-white rounded-full transition-colors hover:bg-orange-600"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Level Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-800">
              Pilih Level Pedas
            </h4>
            <div className="relative">
              <select
                value={selectedLevel?.value || ""}
                onChange={(e) => {
                  const selected = spiceLevels.find(
                    (level) => level.value === e.target.value
                  );
                  setSelectedLevel(selected || null);
                }}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="" disabled>
                  Pilih Level Pedas
                </option>
                {spiceLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={20} className="text-gray-500" />
              </div>
            </div>
          </div>

          {/* Toppings Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-800">
              Pilih Topping (Opsional)
            </h4>
            <div className="space-y-2">
              {initialToppings.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleTopping(option)}
                  className={`w-full p-3 border rounded-xl text-sm flex justify-between items-center transition-all duration-200 ${
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

              {remainingToppings.length > 0 && (
                <>
                  {showAllToppings && (
                    <div className="space-y-2 mt-2">
                      {remainingToppings.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => toggleTopping(option)}
                          className={`w-full p-3 border rounded-xl text-sm flex justify-between items-center transition-all duration-200 ${
                            selectedToppings.some(
                              (t) => t.value === option.value
                            )
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
                  )}
                  <button
                    onClick={() => setShowAllToppings(!showAllToppings)}
                    className="w-full p-2 text-sm text-orange-500 hover:text-orange-600 flex items-center justify-center gap-1"
                  >
                    {showAllToppings ? (
                      <>
                        <span>Tampilkan Lebih Sedikit</span>
                        <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        <span>
                          Lihat {remainingToppings.length} Topping Lainnya
                        </span>
                        <ChevronDown size={16} />
                      </>
                    )}
                  </button>
                </>
              )}
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
