import type { Fulfillment, OrderStatus, PaymentStatus } from './types';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Menunggu konfirmasi',
  accepted: 'Diterima',
  preparing: 'Sedang disiapkan',
  delivering: 'Sedang diantar',
  ready_pickup: 'Siap diambil',
  completed: 'Selesai',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};

export const STATUS_TONE: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-sky-100 text-sky-800',
  preparing: 'bg-sky-100 text-sky-800',
  delivering: 'bg-indigo-100 text-indigo-800',
  ready_pickup: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-stone-200 text-stone-700',
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Belum dibayar',
  pending_verification: 'Cek bukti transfer',
  paid: 'Lunas',
  rejected: 'Bukti ditolak',
};

export const PAYMENT_TONE: Record<PaymentStatus, string> = {
  unpaid: 'bg-stone-100 text-stone-700',
  pending_verification: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

export const ACTIVE: OrderStatus[] = ['accepted', 'preparing', 'delivering', 'ready_pickup'];
export const FINAL: OrderStatus[] = ['completed', 'rejected', 'cancelled'];

export function timeline(f: Fulfillment): OrderStatus[] {
  return f === 'delivery'
    ? ['pending', 'accepted', 'preparing', 'delivering', 'completed']
    : ['pending', 'accepted', 'preparing', 'ready_pickup', 'completed'];
}

export interface SellerAction {
  to: OrderStatus;
  label: string;
  primary?: boolean;
  danger?: boolean;
}

/** Tombol aksi penjual per status (selaras dengan can_transition di SQL). */
export function sellerActions(status: OrderStatus, f: Fulfillment): SellerAction[] {
  const handOff: SellerAction = f === 'delivery'
    ? { to: 'delivering', label: 'Antar sekarang', primary: true }
    : { to: 'ready_pickup', label: 'Siap diambil', primary: true };
  switch (status) {
    case 'pending':
      return [{ to: 'accepted', label: 'Terima pesanan', primary: true }, { to: 'rejected', label: 'Tolak', danger: true }];
    case 'accepted':
      return [{ to: 'preparing', label: 'Mulai siapkan', primary: true }, { ...handOff, primary: false }, { to: 'rejected', label: 'Tolak', danger: true }];
    case 'preparing':
      return [handOff];
    case 'delivering':
    case 'ready_pickup':
      return [{ to: 'completed', label: 'Selesai', primary: true }];
    default:
      return [];
  }
}
