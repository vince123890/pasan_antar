import { describe, expect, it } from 'vitest';
import { normalizeWa, rupiah, slugify } from '../src/lib/format';
import { calcDeliveryFee, validateTiers, type DeliveryConfig } from '../src/lib/geo';
import type { Tier } from '../src/lib/types';
import vectors from './fee-vectors.json';

const TIERS: Tier[] = [
  { from_km: 0, to_km: 5, fee_type: 'free', amount: 0 },
  { from_km: 5, to_km: 10, fee_type: 'flat', amount: 1000 },
  { from_km: 10, to_km: 15, fee_type: 'per_km', amount: 2000 },
];
const CFG: DeliveryConfig = { lat: -6.2, lng: 106.8, road_factor: 1.3, free_delivery_min_order: null, tiers: TIERS };
const east = (km: number) => ({ lat: -6.2, lng: 106.8 + km / (6371 * (Math.PI / 180) * Math.cos((-6.2 * Math.PI) / 180)) });

describe('calcDeliveryFee (vektor yang sama dengan tes SQL)', () => {
  for (const v of vectors) {
    it(v.name, () => {
      const r = calcDeliveryFee(CFG, east(v.straight_km), 0);
      expect(r.distanceKm).toBeCloseTo(v.expected.distance_km, 1);
      expect(r.inCoverage).toBe(v.expected.in_coverage);
      if (r.inCoverage) expect(r.fee).toBe(v.expected.fee);
    });
  }

  it('gratis ongkir bila memenuhi min. belanja', () => {
    const r = calcDeliveryFee({ ...CFG, free_delivery_min_order: 50000 }, east(8), 50000);
    expect(r).toMatchObject({ inCoverage: true, fee: 0, freeByMinOrder: true });
  });

  it('min. belanja tidak berlaku di luar jangkauan', () => {
    const r = calcDeliveryFee({ ...CFG, free_delivery_min_order: 1 }, east(12), 99999);
    expect(r.inCoverage).toBe(false);
  });
});

describe('validateTiers', () => {
  it('valid', () => expect(validateTiers(TIERS)).toEqual([]));
  it('harus mulai 0', () => expect(validateTiers([{ ...TIERS[1] }])).toContain('Tingkat pertama harus mulai dari 0 km'));
  it('tidak boleh berlubang', () => {
    expect(validateTiers([TIERS[0], { ...TIERS[1], from_km: 6 }]).length).toBeGreaterThan(0);
  });
  it('nominal wajib', () => {
    expect(validateTiers([{ ...TIERS[0], fee_type: 'flat', amount: 0 }])).toContain('Baris 1: nominal wajib diisi');
  });
});

describe('format', () => {
  it('normalizeWa', () => {
    expect(normalizeWa('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeWa('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizeWa('812345678')).toBe('62812345678');
    expect(normalizeWa('123')).toBeNull();
  });
  it('slugify', () => {
    expect(slugify('Warung Bu Sri!')).toBe('warung-bu-sri');
    expect(slugify('  Kopi  Gerobak ☕ ')).toBe('kopi-gerobak');
  });
  it('rupiah', () => expect(rupiah(12000).replace(/\s/g, '')).toBe('Rp12.000'));
});
