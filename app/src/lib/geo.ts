import type { LatLng, Tier } from './types';

export interface DeliveryConfig {
  lat: number;
  lng: number;
  road_factor: number;
  free_delivery_min_order: number | null;
  tiers: Tier[];
}

export type FeeResult =
  | { inCoverage: true; distanceKm: number; fee: number; tier: Tier; freeByMinOrder: boolean }
  | { inCoverage: false; distanceKm: number; maxKm: number };

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const round1 = (x: number) => Math.round(x * 10) / 10;

export const sortTiers = (tiers: Tier[]) => [...tiers].sort((a, b) => Number(a.from_km) - Number(b.from_km));

export const maxCoverageKm = (tiers: Tier[]) => sortTiers(tiers).at(-1)?.to_km ?? 0;

/** Perhitungan untuk tampilan. Server (calc_delivery_fee) tetap yang menentukan. */
export function calcDeliveryFee(cfg: DeliveryConfig, to: LatLng, subtotal: number): FeeResult {
  const distanceKm = round1(haversineKm(cfg.lat, cfg.lng, to.lat, to.lng) * Number(cfg.road_factor));
  const tiers = sortTiers(cfg.tiers);
  const tier = tiers.find(
    t => (distanceKm > Number(t.from_km) && distanceKm <= Number(t.to_km)) || (distanceKm === 0 && Number(t.from_km) === 0),
  );
  if (!tier) return { inCoverage: false, distanceKm, maxKm: maxCoverageKm(tiers) };

  const freeByMinOrder = cfg.free_delivery_min_order != null && subtotal >= cfg.free_delivery_min_order;
  const fee = freeByMinOrder
    ? 0
    : tier.fee_type === 'free'
      ? 0
      : tier.fee_type === 'flat'
        ? tier.amount
        : Math.ceil(distanceKm) * tier.amount;
  return { inCoverage: true, distanceKm, fee, tier, freeByMinOrder };
}

/** Daftar pesan error; kosong berarti valid. Aturan sama dengan save_delivery_settings di SQL. */
export function validateTiers(tiers: Tier[]): string[] {
  const errs: string[] = [];
  const t = sortTiers(tiers);
  if (t.length === 0) errs.push('Minimal 1 tingkat tarif');
  if (t.length > 10) errs.push('Maksimal 10 tingkat tarif');
  if (t[0] && Number(t[0].from_km) !== 0) errs.push('Tingkat pertama harus mulai dari 0 km');
  t.forEach((x, i) => {
    const n = i + 1;
    if (!(Number(x.to_km) > Number(x.from_km))) errs.push(`Baris ${n}: "sampai" harus lebih besar dari "dari"`);
    if (Number(x.to_km) > 50) errs.push(`Baris ${n}: maksimal 50 km`);
    if (x.fee_type !== 'free' && !(x.amount > 0)) errs.push(`Baris ${n}: nominal wajib diisi`);
    if (i > 0 && Number(x.from_km) !== Number(t[i - 1].to_km)) {
      errs.push(`Baris ${n}: harus mulai dari ${t[i - 1].to_km} km`);
    }
  });
  return errs;
}

export function describeTier(t: Tier): string {
  if (t.fee_type === 'free') return 'Gratis';
  if (t.fee_type === 'flat') return `Rp${t.amount.toLocaleString('id-ID')} / order`;
  return `Rp${t.amount.toLocaleString('id-ID')} / km`;
}

export const DEFAULT_CENTER: LatLng = { lat: -6.1754, lng: 106.8272 };

export function locate(): Promise<LatLng & { accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('GPS tidak didukung di perangkat ini'));
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => reject(new Error(e.code === 1 ? 'Izin lokasi ditolak. Aktifkan di pengaturan browser.' : 'Lokasi tidak dapat ditemukan')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

export const mapsLink = (p: LatLng) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
export const directionsLink = (p: LatLng) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
