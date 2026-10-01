import type { Session } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';
import { supabase } from './supabase';
import type { Order, OrderStatus, Store } from './types';

export interface SellerContextValue {
  session: Session;
  store: Store;
  setStore: (s: Store) => void;
  orders: Order[];
  ordersLoading: boolean;
  refreshOrders: () => Promise<void>;
  /** Ubah status lewat RPC lalu perbarui state lokal */
  changeStatus: (order: Order, to: OrderStatus, reason?: string) => Promise<void>;
  /** Penjual: tandai lunas (accept) atau tolak bukti transfer */
  confirmPayment: (order: Order, accept: boolean, note?: string) => Promise<void>;
  updateStore: (patch: Partial<Store>) => Promise<void>;
}

export const SellerContext = createContext<SellerContextValue | null>(null);

export function useSeller(): SellerContextValue {
  const ctx = useContext(SellerContext);
  if (!ctx) throw new Error('useSeller harus dipakai di dalam SellerLayout');
  return ctx;
}

const ACTIVE_STATUSES = 'pending,accepted,preparing,delivering,ready_pickup';

/** Pesanan aktif (berapa pun umurnya) + semua pesanan 14 hari terakhir. */
export async function fetchSellerOrders(storeId: string): Promise<Order[]> {
  const since = new Date(Date.now() - 14 * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('store_id', storeId)
    .or(`status.in.(${ACTIVE_STATUSES}),created_at.gte.${since}`)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function fetchOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Order | null;
}
