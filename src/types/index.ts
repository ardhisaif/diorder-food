export interface Merchant {
  id: number;
  name: string;
  address: string;
  logo: string;
  // delivery_fee: number;
  // whatsapp: string;
}

export interface MenuItem {
  id: number;
  merchant_id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  address: string;
  notes: string;
  phone?: string;
  village?: string;
  addressDetail?: string;
}