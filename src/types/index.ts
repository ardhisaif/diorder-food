export interface Merchant {
  id: number;
  name: string;
  address: string;
  logo: string;
  openingHours: {
    open: string;
    close: string;
  };
  updated_at: string;
}

export interface MenuItem {
  id: number;
  merchant_id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  options?: {
    label: string;
    value: string;
    extraPrice: number;
  }[];
  selectedOptions?: {
    level?: {
      label: string;
      value: string;
      extraPrice: number;
    };
    toppings?: {
      label: string;
      value: string;
      extraPrice: number;
    }[];
  };
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  notes: string;
  phone?: string;
  village?: string;
  addressDetail?: string;
}
