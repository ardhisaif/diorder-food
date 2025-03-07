import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, CustomerInfo, MenuItem } from '../types';
import merchantsData from '../data/merchants.json';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, merchantId: number) => void;
  removeFromCart: (itemId: number, merchantId: number) => void;
  updateQuantity: (itemId: number, quantity: number, merchantId: number) => void;
  clearCart: () => void;
  clearMerchantCart: (merchantId: number) => void;
  customerInfo: CustomerInfo;
  updateCustomerInfo: (info: CustomerInfo) => void;
  getCartTotal: () => number;
  getMerchantTotal: (merchantId: number) => number;
  getItemCount: () => number;
  getMerchantItems: (merchantId: number) => CartItem[];
  getMerchantInfo: (merchantId: number) => { name: string; delivery_fee: number; whatsapp: string } | null;
}

interface CartState {
  items: {
    [merchantId: number]: CartItem[];
  };
  customerInfo: CustomerInfo;
}

const CART_STORAGE_KEY = 'diorder_cart_state';

const CartContext = createContext<CartContextType | undefined>(undefined);

const getInitialState = (): CartState => {
  if (typeof window === 'undefined') return {
    items: {},
    customerInfo: { name: '', address: '', notes: '' }
  };

  const savedState = localStorage.getItem(CART_STORAGE_KEY);
  return savedState ? JSON.parse(savedState) : {
    items: {},
    customerInfo: { name: '', address: '', notes: '' }
  };
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CartState>(getInitialState);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addToCart = (item: MenuItem, merchantId: number) => {
    setState(prevState => {
      const merchantItems = prevState.items[merchantId] || [];
      const existingItem = merchantItems.find(cartItem => cartItem.id === item.id);
      
      const updatedMerchantItems = existingItem
        ? merchantItems.map(cartItem =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        : [...merchantItems, { ...item, quantity: 1 }];

      return {
        ...prevState,
        items: {
          ...prevState.items,
          [merchantId]: updatedMerchantItems
        }
      };
    });
  };

  const removeFromCart = (itemId: number, merchantId: number) => {
    setState(prevState => ({
      ...prevState,
      items: {
        ...prevState.items,
        [merchantId]: (prevState.items[merchantId] || []).filter(item => item.id !== itemId)
      }
    }));
  };

  const updateQuantity = (itemId: number, quantity: number, merchantId: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId, merchantId);
      return;
    }

    setState(prevState => ({
      ...prevState,
      items: {
        ...prevState.items,
        [merchantId]: (prevState.items[merchantId] || []).map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      }
    }));
  };

  const clearCart = () => {
    setState(prevState => ({
      ...prevState,
      items: {}
    }));
  };

  const clearMerchantCart = (merchantId: number) => {
    setState(prevState => {
      const { [merchantId]: _, ...remainingItems } = prevState.items;
      return {
        ...prevState,
        items: remainingItems
      };
    });
  };

  const updateCustomerInfo = (info: CustomerInfo) => {
    setState(prevState => ({
      ...prevState,
      customerInfo: info
    }));
  };

  const getCartTotal = () => {
    return Object.values(state.items).reduce((total, merchantItems) => 
      total + merchantItems.reduce((merchantTotal, item) => 
        merchantTotal + (item.price * item.quantity), 0
      ), 0
    );
  };

  const getMerchantTotal = (merchantId: number) => {
    return (state.items[merchantId] || []).reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const getItemCount = () => {
    return Object.values(state.items).reduce((total, merchantItems) => 
      total + merchantItems.reduce((count, item) => count + item.quantity, 0), 0
    );
  };

  const getMerchantItems = (merchantId: number) => {
    return state.items[merchantId] || [];
  };

  const getMerchantInfo = (merchantId: number) => {
    const merchant = merchantsData.find(m => m.id === merchantId);
    return merchant ? {
      name: merchant.name,
      delivery_fee: merchant.delivery_fee,
      whatsapp: "082217012023"
    } : null;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: Object.values(state.items).flat(),
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearMerchantCart,
        customerInfo: state.customerInfo,
        updateCustomerInfo,
        getCartTotal,
        getMerchantTotal,
        getItemCount,
        getMerchantItems,
        getMerchantInfo
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};