import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  title: string;
  showBack?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBack = false
}) => {
  const navigate = useNavigate();
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  console.log(itemCount);
  

  return (
    <header className="bg-orange-500 text-white py-4 px-4 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {showBack && (
            <button 
              onClick={() => navigate(-1)} 
              className="mr-3"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        {itemCount > 0 && (
          <button 
            onClick={() => navigate('/cart')} 
            className="relative"
          >
            <ShoppingBag size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {itemCount}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;