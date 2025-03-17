import React from 'react';
import { MenuItem } from '../types';
import { Plus, Minus, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  item: MenuItem;
  merchantId: number;
  merchantName: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ item, merchantId, merchantName }) => {
  const { addToCart, removeFromCart, getItemQuantity } = useCart();
  const quantity = getItemQuantity(item.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex">
        <img
          src={item.image}
          alt={item.name}
          className="w-24 h-24 object-cover"
        />
        <div className="p-3 flex-1">
          <h3 className="font-bold">{item.name}</h3>
          <Link to={`/menu/${merchantId}`} className="text-sm text-blue-500 flex items-center">
            <Info size={14} className="mr-1" />
            {merchantName}
          </Link>
          <div className="flex justify-between items-center mt-2">
            <span className="font-bold text-orange-500">{formatCurrency(item.price)}</span>
            <div className="flex items-center">
              {quantity > 0 ? (
                <>
                  <button
                    onClick={() => removeFromCart(item.id, merchantId)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="mx-2 font-medium">{quantity}</span>
                </>
              ) : null}
              <button
                onClick={() => addToCart(item, merchantId)}
                className="w-8 h-8 flex items-center justify-center bg-orange-500 text-white rounded-full"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;