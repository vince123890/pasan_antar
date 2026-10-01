import { rupiah } from './format';

const MESSAGES: Record<string, string | ((detail: string) => string)> = {
  AUTH_REQUIRED: 'Sesi tidak ditemukan, muat ulang halaman.',
  STORE_NOT_FOUND: 'Toko tidak ditemukan atau sudah tidak aktif.',
  STORE_CLOSED: 'Toko sedang tutup. Coba lagi nanti.',
  TOO_MANY_PENDING: 'Anda masih punya 3 pesanan yang menunggu di toko ini.',
  INVALID_BUYER: 'Nama atau nomor WhatsApp tidak valid.',
  INVALID_CART: 'Keranjang kosong atau tidak valid.',
  INVALID_QTY: 'Jumlah barang tidak valid.',
  PAYMENT_UNAVAILABLE: 'Metode pembayaran tidak tersedia di toko ini.',
  PRODUCT_UNAVAILABLE: 'Ada produk yang sudah habis. Periksa keranjang Anda.',
  BELOW_MIN_ORDER: d => `Minimal belanja ${rupiah(Number(d))}.`,
  DELIVERY_DISABLED: 'Toko ini sedang tidak melayani antar.',
  PICKUP_DISABLED: 'Toko ini tidak melayani ambil sendiri.',
  LOCATION_REQUIRED: 'Tentukan lokasi & alamat pengantaran.',
  OUT_OF_COVERAGE: d => `Lokasi Anda ±${d} km, di luar area antar toko.`,
  PRICE_CHANGED: d => `Harga atau ongkir berubah. Total baru ${rupiah(Number(d))}.`,
  ORDER_NOT_FOUND: 'Pesanan tidak ditemukan.',
  FORBIDDEN: 'Anda tidak punya akses.',
  STATUS_CONFLICT: 'Status pesanan sudah berubah. Halaman dimuat ulang.',
  INVALID_TRANSITION: 'Perubahan status tidak diizinkan.',
  REASON_REQUIRED: 'Alasan penolakan wajib diisi.',
  INVALID_TIERS: 'Tarif ongkir tidak valid.',
};

export interface AppError {
  code: string | null;
  detail: string;
  message: string;
}

/** Ubah error Supabase/PostgREST jadi pesan Bahasa Indonesia. */
export function toAppError(err: unknown): AppError {
  const e = (err ?? {}) as { message?: string; details?: string; code?: string };
  const raw = e.message ?? String(err);
  const code = Object.keys(MESSAGES).find(k => raw === k || raw.startsWith(k + ' ') || raw.endsWith(k)) ?? null;
  const detail = e.details ?? '';
  if (code) {
    const m = MESSAGES[code];
    return { code, detail, message: typeof m === 'function' ? m(detail) : m };
  }
  if (/anonymous sign-ins are disabled/i.test(raw)) {
    return { code: 'ANON_DISABLED', detail, message: 'Pemesanan tanpa daftar belum diaktifkan oleh pengelola aplikasi. Coba lagi nanti.' };
  }
  if (/provider is not enabled/i.test(raw)) {
    return { code: 'PROVIDER_DISABLED', detail, message: 'Metode login ini belum diaktifkan. Gunakan login dengan email.' };
  }
  if (/fetch|network|load failed/i.test(raw) || !navigator.onLine) {
    return { code: 'NETWORK', detail, message: 'Tidak ada koneksi internet. Coba lagi.' };
  }
  if (e.code === '23505') return { code: 'DUPLICATE', detail, message: 'Data sudah ada.' };
  if (e.code === '42501') return { code: 'FORBIDDEN', detail, message: 'Anda tidak punya akses.' };
  return { code: null, detail, message: raw || 'Terjadi kesalahan.' };
}
