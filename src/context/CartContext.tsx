import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { CartItem, CustomerInfo, MenuItem } from "../types";
import supabase from "../utils/supabase/client";
import { isCurrentlyOpen } from "../utils/merchantUtils";
import { Merchant } from "../types";
import { indexedDBService } from "../utils/indexedDB";

// Add a constant for localStorage key
const CUSTOMER_INFO_STORAGE_KEY = "diorder_customer_info";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, merchantId: number, quantity?: number) => void;
  removeFromCart: (itemId: number, merchantId: number) => void;
  updateQuantity: (
    itemId: number,
    quantity: number,
    merchantId: number
  ) => void;
  updateItemNotes: (itemId: number, notes: string, merchantId: number) => void;
  clearCart: () => void;
  clearMerchantCart: (merchantId: number) => void;
  customerInfo: CustomerInfo;
  updateCustomerInfo: (info: CustomerInfo) => void;
  getCartTotal: () => number;
  getMerchantTotal: (merchantId: number) => number;
  getItemCount: () => number;
  getMerchantItems: (merchantId: number) => CartItem[];
  useMerchantInfo: (merchantId: number) => { name: string } | null;
  getItemQuantity: (itemId: number) => number;
  getSubtotal: () => number;
}

interface CartState {
  items: {
    [merchantId: number]: CartItem[];
  };
  customerInfo: CustomerInfo;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getInitialState = (): CartState => {
  if (typeof window === "undefined") {
    return {
      items: {},
      customerInfo: { name: "", address: "", notes: "" },
    };
  }

  // Try to get customer info from localStorage
  let savedCustomerInfo: CustomerInfo = { name: "", address: "", notes: "" };
  try {
    const savedInfo = localStorage.getItem(CUSTOMER_INFO_STORAGE_KEY);
    if (savedInfo) {
      savedCustomerInfo = JSON.parse(savedInfo);
    }
  } catch (error) {
    console.error("Error reading customer info from localStorage:", error);
  }

  return {
    items: {},
    customerInfo: savedCustomerInfo,
  };
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<CartState>(getInitialState);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const [isDBReady, setIsDBReady] = useState(false);

  // Initialize IndexedDB and load cart data
  useEffect(() => {
    const initDB = async () => {
      try {
        await indexedDBService.initDB();
        setIsDBReady(true);

        // Load cart data from IndexedDB
        const cartItems = await indexedDBService.getCart();
        if (cartItems.length > 0) {
          const groupedItems = cartItems.reduce((acc, item) => {
            if (!acc[item.merchant_id]) {
              acc[item.merchant_id] = [];
            }
            acc[item.merchant_id].push(item);
            return acc;
          }, {} as CartState["items"]);

          setState((prev) => ({
            ...prev,
            items: groupedItems,
          }));
        }
      } catch (error) {
        console.error("Error initializing IndexedDB:", error);
      }
    };
    initDB();
  }, []);

  // Sync cart data to IndexedDB whenever it changes
  useEffect(() => {
    if (!isDBReady) return;
    if (isClearingCart) return;

    const syncToIndexedDB = async () => {
      try {
        // Get all current cart items
        const allItems = Object.entries(state.items).flatMap(
          ([merchantId, items]) =>
            items.map((item) => ({
              ...item,
              merchant_id: Number(merchantId),
              // Ensure selectedOptions is properly structured
              selectedOptions: item.selectedOptions
                ? {
                    level: item.selectedOptions.level
                      ? {
                          label: item.selectedOptions.level.label,
                          value: item.selectedOptions.level.value,
                          extraPrice: item.selectedOptions.level.extraPrice,
                        }
                      : undefined,
                    toppings: item.selectedOptions.toppings?.map((topping) => ({
                      label: topping.label,
                      value: topping.value,
                      extraPrice: topping.extraPrice,
                    })),
                  }
                : undefined,
            }))
        );

        // Clear existing cart in IndexedDB
        await indexedDBService.clearCart();

        // Add all current items to IndexedDB
        for (const item of allItems) {
          await indexedDBService.addToCart(item);
        }
      } catch (error) {
        console.error("Error syncing to IndexedDB:", error);
      }
    };

    syncToIndexedDB();
  }, [state.items, isDBReady, isClearingCart]);

  // Effect to save customer info to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          CUSTOMER_INFO_STORAGE_KEY,
          JSON.stringify(state.customerInfo)
        );
      } catch (error) {
        console.error("Error saving customer info to localStorage:", error);
      }
    }
  }, [state.customerInfo]);

  const addToCart = (
    item: MenuItem,
    merchantId: number,
    quantity: number = 1
  ) => {
    setState((prevState) => {
      const merchantItems = prevState.items[merchantId] || [];

      // Create a unique identifier for the item based on its options
      const itemKey = item.selectedOptions
        ? `${item.id}-${item.selectedOptions.level?.value}-${
            item.selectedOptions.toppings
              ?.map((t) => t.value)
              .sort()
              .join("-") || ""
          }`
        : item.id.toString();

      const existingItem = merchantItems.find((cartItem) => {
        if (!item.selectedOptions && !cartItem.selectedOptions) {
          return cartItem.id === item.id;
        }
        if (item.selectedOptions && cartItem.selectedOptions) {
          const cartItemKey = `${cartItem.id}-${
            cartItem.selectedOptions.level?.value
          }-${
            cartItem.selectedOptions.toppings
              ?.map((t) => t.value)
              .sort()
              .join("-") || ""
          }`;
          return cartItemKey === itemKey;
        }
        return false;
      });

      const updatedMerchantItems = existingItem
        ? merchantItems.map((cartItem) => {
            const cartItemKey = cartItem.selectedOptions
              ? `${cartItem.id}-${cartItem.selectedOptions.level?.value}-${
                  cartItem.selectedOptions.toppings
                    ?.map((t) => t.value)
                    .sort()
                    .join("-") || ""
                }`
              : cartItem.id.toString();

            return cartItemKey === itemKey
              ? { ...cartItem, quantity: cartItem.quantity + quantity }
              : cartItem;
          })
        : [...merchantItems, { ...item, quantity, notes: "" }];

      return {
        ...prevState,
        items: {
          ...prevState.items,
          [merchantId]: updatedMerchantItems,
        },
      };
    });
  };

  const removeFromCart = (itemId: number, merchantId: number) => {
    setState((prevState) => {
      const merchantItems = prevState.items[merchantId] || [];
      const existingItem = merchantItems.find(
        (cartItem) => cartItem.id === itemId
      );

      if (!existingItem) return prevState;

      // Create a unique identifier for the item based on its options
      const itemKey = existingItem.selectedOptions
        ? `${existingItem.id}-${existingItem.selectedOptions.level?.value}-${
            existingItem.selectedOptions.toppings
              ?.map((t) => t.value)
              .sort()
              .join("-") || ""
          }`
        : existingItem.id.toString();

      const updatedMerchantItems = merchantItems
        .map((cartItem) => {
          const cartItemKey = cartItem.selectedOptions
            ? `${cartItem.id}-${cartItem.selectedOptions.level?.value}-${
                cartItem.selectedOptions.toppings
                  ?.map((t) => t.value)
                  .sort()
                  .join("-") || ""
              }`
            : cartItem.id.toString();

          if (cartItemKey === itemKey) {
            return cartItem.quantity > 1
              ? { ...cartItem, quantity: cartItem.quantity - 1 }
              : null;
          }
          return cartItem;
        })
        .filter(Boolean) as CartItem[];

      return {
        ...prevState,
        items: {
          ...prevState.items,
          [merchantId]: updatedMerchantItems,
        },
      };
    });
  };

  const updateQuantity = (
    itemId: number,
    quantity: number,
    merchantId: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(itemId, merchantId);
      return;
    }

    setState((prevState) => {
      const merchantItems = prevState.items[merchantId] || [];
      const updatedMerchantItems = merchantItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );

      return {
        ...prevState,
        items: {
          ...prevState.items,
          [merchantId]: updatedMerchantItems,
        },
      };
    });
  };

  const updateItemNotes = (
    itemId: number,
    notes: string,
    merchantId: number
  ) => {
    setState((prevState) => {
      const merchantItems = prevState.items[merchantId] || [];
      const updatedMerchantItems = merchantItems.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      );

      return {
        ...prevState,
        items: {
          ...prevState.items,
          [merchantId]: updatedMerchantItems,
        },
      };
    });
  };

  // Modify the clearCart function to properly handle IndexedDB
  const clearCart = async () => {
    setIsClearingCart(true);
    setState((prevState) => ({
      ...prevState,
      items: {},
    }));

    try {
      // Get all cart items from IndexedDB
      const cartItems = await indexedDBService.getCart();

      // Delete each item
      for (const item of cartItems) {
        const itemKey = item.selectedOptions
          ? `${item.selectedOptions.level?.value || ""}-${
              item.selectedOptions.toppings
                ?.map((t) => t.value)
                .sort()
                .join("-") || ""
            }`
          : "default";
        await indexedDBService.removeFromCart(
          item.id,
          item.merchant_id,
          itemKey
        );
      }
    } catch (error) {
      console.error("Error clearing cart in IndexedDB:", error);
    } finally {
      setIsClearingCart(false);
    }
  };

  const clearMerchantCart = (merchantId: number) => {
    setState((prevState) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [merchantId]: _, ...remainingItems } = prevState.items;
      return {
        ...prevState,
        items: remainingItems,
      };
    });
  };

  const updateCustomerInfo = (info: CustomerInfo) => {
    setState((prevState) => ({
      ...prevState,
      customerInfo: info,
    }));

    // This is redundant due to the useEffect above, but adding as a safeguard
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(CUSTOMER_INFO_STORAGE_KEY, JSON.stringify(info));
      } catch (error) {
        console.error("Error saving customer info to localStorage:", error);
      }
    }
  };

  const getCartTotal = () => {
    return Object.values(state.items).reduce(
      (total, merchantItems) =>
        total +
        merchantItems.reduce(
          (merchantTotal, item) => merchantTotal + item.price * item.quantity,
          0
        ),
      0
    );
  };

  const getMerchantTotal = (merchantId: number) => {
    const merchantItems = state.items[merchantId] || [];
    return merchantItems.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;

      // Add level price if exists
      if (item.selectedOptions?.level) {
        itemTotal += item.selectedOptions.level.extraPrice * item.quantity;
      }

      // Add toppings price if exists
      if (item.selectedOptions?.toppings) {
        item.selectedOptions.toppings.forEach((topping) => {
          itemTotal += topping.extraPrice * item.quantity;
        });
      }

      return total + itemTotal;
    }, 0);
  };

  const getItemCount = () => {
    return Object.values(state.items).reduce(
      (total, merchantItems) =>
        total + merchantItems.reduce((count, item) => count + item.quantity, 0),
      0
    );
  };

  const getMerchantItems = (merchantId: number) => {
    return state.items[merchantId] || [];
  };

  const useMerchantInfo = (merchantId: number) => {
    const [merchantInfo, setMerchantInfo] = useState<{ name: string } | null>(
      null
    );

    useEffect(() => {
      const fetchMerchant = async () => {
        const { data, error } = await supabase
          .from("merchants")
          .select("name")
          .eq("id", merchantId)
          .single();

        if (error) {
          // console.error("Error fetching merchant info:", error);
          setMerchantInfo(null);
        } else {
          setMerchantInfo(data);
        }
      };

      if (navigator.onLine) fetchMerchant();
    }, [merchantId]);

    return merchantInfo;
  };

  const getItemQuantity = (itemId: number) => {
    for (const merchantItems of Object.values(state.items)) {
      const item = merchantItems.find((item) => item.id === itemId);
      if (item) {
        return item.quantity;
      }
    }
    return 0;
  };

  const [merchantsData, setMerchantsData] = useState<Merchant[]>([]);

  useEffect(() => {
    const fetchMerchantsData = async () => {
      const { data, error } = await supabase.from("merchants").select("*");
      if (error) {
        // console.error("Error fetching merchants data:", error);
        setMerchantsData([]);
      } else {
        setMerchantsData(data || []);
      }
    };

    if (navigator.onLine) {
      fetchMerchantsData();
    }
  }, []);

  const getSubtotal = () => {
    return Object.keys(state.items).reduce((total, merchantId) => {
      const merchant = merchantsData.find((m) => m.id === Number(merchantId));
      if (merchant && isCurrentlyOpen(merchant.openingHours)) {
        return total + getMerchantTotal(Number(merchantId));
      }
      return total;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems: Object.values(state.items).flat(),
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemNotes,
        clearCart,
        clearMerchantCart,
        customerInfo: state.customerInfo,
        updateCustomerInfo,
        getCartTotal,
        getMerchantTotal,
        getItemCount,
        getMerchantItems,
        useMerchantInfo,
        getItemQuantity,
        getSubtotal,
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
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
