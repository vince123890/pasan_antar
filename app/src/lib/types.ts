export type FeeType = 'free' | 'flat' | 'per_km';
export type Fulfillment = 'delivery' | 'pickup';
export type PaymentMethod = 'cod' | 'transfer';
export type OrderStatus =
  | 'pending' | 'accepted' | 'preparing' | 'delivering'
  | 'ready_pickup' | 'completed' | 'rejected' | 'cancelled';

export interface StoreCategory {
  code: string;
  label: string;
  icon: string | null;
  sort: number;
}

export interface Store {
  id: string;
  owner_id?: string;
  slug: string;
  name: string;
  category_code: string;
  description: string | null;
  logo_url: string | null;
  wa_phone: string;
  address: string | null;
  lat: number;
  lng: number;
  is_open: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  road_factor: number;
  free_delivery_min_order: number | null;
  min_order: number | null;
  bank_info: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tier {
  id?: string;
  store_id?: string;
  from_km: number;
  to_km: number;
  fee_type: FeeType;
  amount: number;
}

export interface ProductCategory {
  id: string;
  store_id: string;
  name: string;
  sort: number;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort: number;
  deleted_at?: string | null;
}

export interface Catalog {
  store: Store;
  tiers: Tier[];
  categories: ProductCategory[];
  products: Product[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  qty: number;
  note: string | null;
  line_total: number;
}

export interface Order {
  id: string;
  code: string;
  store_id: string;
  buyer_id?: string;
  track_token?: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  payment_method: PaymentMethod;
  buyer_name: string;
  buyer_phone?: string;
  address: string | null;
  buyer_lat?: number | null;
  buyer_lng?: number | null;
  distance_km: number | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  note: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface LatLng {
  lat: number;
  lng: number;
}
