// Penyimpanan lokal pembeli (keranjang, profil, riwayat, cache katalog).
// Semua akses dibungkus try/catch karena localStorage bisa diblokir (mode privat, dll).
import { useSyncExternalStore } from 'react';
import type { Catalog, LatLng } from './types';

const PREFIX = 'pa:';
const listeners = new Set<() => void>();
const cache = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let v = fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) v = JSON.parse(raw) as T;
  } catch { /* abaikan */ }
  cache.set(key, v);
  return v;
}

function write<T>(key: string, value: T) {
  cache.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch { /* penuh / diblokir: tetap jalan di memori */ }
  listeners.forEach(l => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX)) {
      cache.delete(e.key.slice(PREFIX.length));
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

function useLocal<T>(key: string, fallback: T): T {
  return useSyncExternalStore(subscribe, () => read(key, fallback), () => fallback);
}

// ---------- Keranjang ----------
export interface CartLine {
  product_id: string;
  qty: number;
  note?: string;
}
const EMPTY_CART: CartLine[] = [];
const cartKey = (storeId: string) => `cart:${storeId}`;

export const useCart = (storeId: string) => useLocal<CartLine[]>(cartKey(storeId), EMPTY_CART);
export const getCart = (storeId: string) => read<CartLine[]>(cartKey(storeId), EMPTY_CART);

export function setQty(storeId: string, productId: string, qty: number) {
  const cart = getCart(storeId).filter(l => l.product_id !== productId || qty > 0);
  const existing = cart.find(l => l.product_id === productId);
  const q = Math.min(99, Math.max(0, qty));
  if (existing) write(cartKey(storeId), cart.map(l => (l.product_id === productId ? { ...l, qty: q } : l)));
  else if (q > 0) write(cartKey(storeId), [...cart, { product_id: productId, qty: q }]);
  else write(cartKey(storeId), cart);
}

export function setLineNote(storeId: string, productId: string, note: string) {
  write(cartKey(storeId), getCart(storeId).map(l => (l.product_id === productId ? { ...l, note } : l)));
}

export const clearCart = (storeId: string) => write(cartKey(storeId), EMPTY_CART);

// ---------- Profil pembeli ----------
export interface BuyerProfile {
  name: string;
  phone: string;
  address: string;
  location: LatLng | null;
}
const EMPTY_PROFILE: BuyerProfile = { name: '', phone: '', address: '', location: null };
export const getProfile = () => read<BuyerProfile>('profile', EMPTY_PROFILE);
export const saveProfile = (p: BuyerProfile) => write('profile', p);

// ---------- Riwayat pesanan di perangkat ----------
export interface MyOrder {
  id: string;
  code: string;
  track_token: string;
  store_name: string;
  store_slug: string;
  total: number;
  created_at: string;
}
const EMPTY_ORDERS: MyOrder[] = [];
export const useMyOrders = () => useLocal<MyOrder[]>('my_orders', EMPTY_ORDERS);
export function addMyOrder(o: MyOrder) {
  const list = read<MyOrder[]>('my_orders', EMPTY_ORDERS).filter(x => x.id !== o.id);
  write('my_orders', [o, ...list].slice(0, 50));
}
export const findMyOrder = (id: string) => read<MyOrder[]>('my_orders', EMPTY_ORDERS).find(o => o.id === id);

// ---------- Toko yang pernah dibuka + cache katalog (untuk offline) ----------
export interface RecentStore {
  slug: string;
  name: string;
  logo_url: string | null;
  visited_at: number;
}
const EMPTY_RECENT: RecentStore[] = [];
export const useRecentStores = () => useLocal<RecentStore[]>('recent_stores', EMPTY_RECENT);

export function cacheCatalog(c: Catalog) {
  write(`catalog:${c.store.slug}`, { at: Date.now(), catalog: c });
  const list = read<RecentStore[]>('recent_stores', EMPTY_RECENT).filter(s => s.slug !== c.store.slug);
  write('recent_stores', [
    { slug: c.store.slug, name: c.store.name, logo_url: c.store.logo_url, visited_at: Date.now() },
    ...list,
  ].slice(0, 10));
}

export const getCachedCatalog = (slug: string) =>
  read<{ at: number; catalog: Catalog } | null>(`catalog:${slug}`, null);

// ---------- Preferensi penjual ----------
export const getPref = <T,>(key: string, fallback: T) => read<T>(`pref:${key}`, fallback);
export const setPref = <T,>(key: string, value: T) => write(`pref:${key}`, value);
