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
  getMerchantInfo: (merchantId: number) => { name: string; delivery_fee: number } | null;
  getItemQuantity: (itemId: number) => number;
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

  try {
    const savedState = localStorage.getItem(CART_STORAGE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Error parsing cart state from localStorage:', error);
  }
  
  return {
    items: {},
    customerInfo: { name: '', address: '', notes: '' }
  };
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CartState>(getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart state to localStorage:', error);
    }
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
    setState(prevState => {
      const merchantItems = prevState.items[merchantId] || [];
      const existingItem = merchantItems.find(cartItem => cartItem.id === itemId);
      
      if (!existingItem) return prevState;
      
      let updatedMerchantItems;
      
      if (existingItem.quantity > 1) {
        // Decrease quantity if more than 1
        updatedMerchantItems = merchantItems.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        // Remove item if quantity is 1
        updatedMerchantItems = merchantItems.filter(cartItem => cartItem.id !== itemId);
      }
      
      return {
        ...prevState,
        items: {
          ...prevState.items,
          [merchantId]: updatedMerchantItems
        }
      };
    });
  };

  const updateQuantity = (itemId: number, quantity: number, merchantId: number) => {
    if (quantity <= 0) {
      // Remove item completely if quantity is 0 or negative
      setState(prevState => {
        const merchantItems = prevState.items[merchantId] || [];
        const updatedMerchantItems = merchantItems.filter(item => item.id !== itemId);
        
        return {
          ...prevState,
          items: {
            ...prevState.items,
            [merchantId]: updatedMerchantItems
          }
        };
      });
      return;
    }

    setState(prevState => {
      const merchantItems = prevState.items[merchantId] || [];
      const updatedMerchantItems = merchantItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      return {
        ...prevState,
        items: {
          ...prevState.items,
          [merchantId]: updatedMerchantItems
        }
      };
    });
  };

  const clearCart = () => {
    setState(prevState => ({
      ...prevState,
      items: {}
    }));
  };

  const clearMerchantCart = (merchantId: number) => {
    setState(prevState => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      delivery_fee: merchant.delivery_fee || 0
    } : null;
  };

  const getItemQuantity = (itemId: number) => {
    // Check all merchants for the item
    for (const merchantItems of Object.values(state.items)) {
      const item = merchantItems.find(item => item.id === itemId);
      if (item) {
        return item.quantity;
      }
    }
    return 0;
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
        getMerchantInfo,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};