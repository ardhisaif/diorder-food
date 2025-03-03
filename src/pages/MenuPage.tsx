import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MenuItem as MenuItemType, Merchant } from '../types';
import MenuItem from '../components/MenuItem';
import Header from '../components/Header';
import menuData from '../data/menu.json';
import merchantsData from '../data/merchants.json';
import { useCart } from '../context/CartContext';

const MenuPage: React.FC = () => {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const { clearCart } = useCart();
  
  // Only run this effect when the merchantId changes
  useEffect(() => {
    // Clear cart when visiting a new merchant
    clearCart();
    
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
  }, [merchantId]); // Only depend on merchantId, not clearCart

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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        title={merchant.name} 
        showBack 
        showCart 
        merchantId={merchant.id} 
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
              <MenuItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuPage;