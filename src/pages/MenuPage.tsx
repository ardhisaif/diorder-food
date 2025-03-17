import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MenuItem as MenuItemType, Merchant } from '../types';
import MenuItem from '../components/MenuItem';
import Header from '../components/Header';
import menuData from '../data/menu.json';
import merchantsData from '../data/merchants.json';
import { useCart } from '../context/CartContext';
import { ShoppingBag } from 'lucide-react';

const MenuPage: React.FC = () => {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const { getMerchantItems, getCartTotal } = useCart();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Find the merchant
    const foundMerchant = merchantsData.find(
      (m) => m.id === Number(merchantId)
    );
    
    if (foundMerchant) {
      setMerchant(foundMerchant);
    }
    
    // Filter menu items for this merchant
    const filteredMenu = menuData.filter(
      (item) => item.merchant_id === Number(merchantId)
    );
    
    setMenuItems(filteredMenu);
  }, [merchantId]);

  if (!merchant) {
    return <div>Loading...</div>;
  }

  // Group menu items by category
  const menuByCategory: Record<string, MenuItemType[]> = {};
  menuItems.forEach((item) => {
    if (!menuByCategory[item.category]) {
      menuByCategory[item.category] = [];
    }
    menuByCategory[item.category].push(item);
  });

  const cartItems = getMerchantItems(merchant.id);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = getCartTotal();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-32">
      <Header 
        title={merchant.name} 
        showBack
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="font-bold text-lg">{merchant.name}</h2>
          <p className="text-gray-600 text-sm">{merchant.address}</p>
        </div>
        
        {Object.entries(menuByCategory).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-bold mb-3">{category}</h3>
            {items.map((item) => (
              <MenuItem key={item.id} item={item} merchantId={merchant.id} />
            ))}
          </div>
        ))}
      </div>

      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="container mx-auto max-w-md">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="text-gray-600">Total Pesanan:</div>
                <div className="font-bold text-lg">{formatCurrency(totalAmount)}</div>
              </div>
              <button
                onClick={() => navigate('/cart')}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-bold flex items-center"
              >
                <ShoppingBag className="mr-2" size={20} />
                <span>Keranjang ({itemCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;