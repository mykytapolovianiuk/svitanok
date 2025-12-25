
export interface Profile {
  id: string;
  role: 'user' | 'admin';
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  external_id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  old_price: number | null;
  currency: string;
  images: string[];
  attributes: Record<string, any> | null;
  in_stock: boolean;
  is_bestseller?: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'new';
  total_price: number;
  delivery_info: DeliveryInfo | null;
  delivery_method: 'nova_poshta_dept' | 'nova_poshta_courier' | 'ukrposhta' | 'quick_order' | null;
  payment_method: 'cash' | 'card' | 'on_receipt';
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  ttn: string | null;
  created_at: string;
  updated_at: string;
  payment_status: string;
  payment_transaction_id: string | null;
  discount_amount: number | null;
  promo_code: string | null;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  product_name: string;
}

export interface Favorite {
  id: number;
  user_id: string;
  product_id: number;
  created_at: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: string | null;
  user_name: string;
  rating: number;
  comment: string | null;
  admin_reply: string | null;
  is_approved: boolean;
  created_at: string;
}


export interface DeliveryInfo {
  full_name: string;
  phone: string;
  city: string;
  warehouse: string;
  warehouse_ref?: string;
  comment?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  problemTags?: string[];
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    phone?: string; 
  };
  profile: Profile | null;
}



export interface OrderWithItems extends Order {
  items: (OrderItem & { product: Product })[];
}

export interface SiteSetting {
  key: string;
  value: string;
  label: string;
}


export interface ReviewWithProduct extends Review {
  product: {
    name: string;
    slug: string;
  } | null;
}


export interface CityOption {
  value: string;
  label: string;
  ref?: string; 
}

export interface WarehouseOption {
  value: string;
  label: string;
  ref?: string; 
}