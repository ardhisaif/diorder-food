import React from 'react';
import { CartItem as CartItemType } from '../types';
import { useCart } from '../context/CartContext';
import { Plus, Minus } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
  merchantId: number;
}

const CartItem: React.FC<CartItemProps> = ({ item, merchantId }) => {
  const { updateQuantity } = useCart();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex items-center py-4 border-b">
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-md"
      />
      <div className="ml-4 flex-1">
        <h3 className="font-medium">{item.name}</h3>
        <div className="flex justify-between items-center mt-2">
          <div className="text-orange-500 font-bold">
            {formatCurrency(item.price)}
          </div>
          <div className="flex items-center">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1, merchantId)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white"
            >
              <Minus size={14} />
            </button>
            <span className="mx-2 w-6 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1, merchantId)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-500 text-white"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-700">
          Subtotal: {formatCurrency(item.price * item.quantity)}
        </div>
      </div>
    </div>
  );
};

export default CartItem