import React from 'react';
import { MenuItem as MenuItemType } from '../types';
import { useCart } from '../context/CartContext';
import { Plus, Minus } from 'lucide-react';

interface MenuItemProps {
  item: MenuItemType;
  merchantId: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, merchantId }) => {
  const { getMerchantItems, addToCart, updateQuantity } = useCart();
  
  const cartItems = getMerchantItems(merchantId);
  const cartItem = cartItems.find((cartItem) => cartItem.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleIncrement = () => {
    addToCart(item, merchantId);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(item.id, quantity - 1, merchantId);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4 flex">
      <img
        src={item.image}
        alt={item.name}
        className="w-24 h-24 object-cover"
      />
      <div className="p-3 flex-1">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <span className="text-orange-500 font-bold">
              {formatCurrency(item.price)}
            </span>
            <div className="text-xs text-gray-500 mt-1">{item.category}</div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleDecrement}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                quantity > 0 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'
              }`}
              disabled={quantity === 0}
            >
              <Minus size={16} />
            </button>
            <span className="mx-2 w-6 text-center">{quantity}</span>
            <button
              onClick={handleIncrement}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        {quantity > 0 && (
          <div className="mt-2 text-sm text-gray-700">
            Subtotal: {formatCurrency(item.price * quantity)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItem;