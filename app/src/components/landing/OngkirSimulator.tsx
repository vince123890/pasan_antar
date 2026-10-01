// Simulator ongkir interaktif: geser jarak, lihat tarif berubah (aturan sama dengan checkout).
import { useState } from 'react';
import { rupiah } from '../../lib/format';
import { describeTier, feeForDistance } from '../../lib/geo';
import type { Tier } from '../../lib/types';
import { Icon } from '../Icon';

const TIERS: Tier[] = [
  { from_km: 0, to_km: 5, fee_type: 'free', amount: 0 },
  { from_km: 5, to_km: 10, fee_type: 'flat', amount: 1000 },
  { from_km: 10, to_km: 15, fee_type: 'per_km', amount: 2000 },
];
const MAX = 17;
const COLORS = ['bg-emerald-400', 'bg-amber-400', 'bg-brand-500'];

export default function OngkirSimulator() {
  const [km, setKm] = useState(3.9);
  const [bigOrder, setBigOrder] = useState(false);
  const r = feeForDistance(TIERS, km, bigOrder ? 50000 : 20000, 50000);
  const pct = (km / MAX) * 100;

  return (
    <div className="rounded-3xl bg-white p-5 text-stone-900 shadow-2xl md:p-6">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-stone-500">Coba geser jarak</p>
        <p className="text-sm text-stone-500">Tarif contoh Warung Bu Sri</p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase">Jarak</p>
          <p className="text-4xl font-extrabold tabular-nums">{km.toFixed(1).replace('.', ',')}<span className="text-xl text-stone-400"> km</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-stone-500 uppercase">Ongkir</p>
          <p key={r.inCoverage ? r.fee : -1} className={`word-rise text-3xl font-extrabold tabular-nums ${!r.inCoverage ? 'text-stone-400' : r.fee === 0 ? 'text-emerald-600' : 'text-stone-900'}`}>
            {!r.inCoverage ? 'Di luar area' : r.fee === 0 ? 'GRATIS' : rupiah(r.fee)}
          </p>
        </div>
      </div>

      <div className="relative mt-6 pt-8">
        <div
          className="absolute top-0 -translate-x-1/2 text-brand-600 transition-[left] duration-300"
          style={{ left: `${pct}%`, transitionTimingFunction: 'var(--ease-out)' }}
        >
          <Icon name="scooter" className="h-7 w-7" />
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-stone-200">
          {TIERS.map((t, i) => (
            <div key={i} className={`${COLORS[i]} h-full ${km > t.from_km ? 'opacity-100' : 'opacity-30'} transition-opacity`}
              style={{ width: `${((t.to_km - t.from_km) / MAX) * 100}%` }} />
          ))}
        </div>
        <input
          type="range" min={0} max={MAX} step={0.1} value={km} onChange={e => setKm(Number(e.target.value))}
          className="range-brand absolute inset-x-0 bottom-[-6px] h-6 w-full cursor-pointer opacity-0"
          aria-label="Jarak dalam kilometer"
        />
        <div className="mt-2 flex justify-between text-[11px] text-stone-400 tabular-nums">
          <span>0</span><span>5</span><span>10</span><span>15 km</span><span />
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        {TIERS.map((t, i) => {
          const active = r.inCoverage && r.tier.from_km === t.from_km;
          return (
            <li key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 transition-colors ${active ? 'bg-stone-900 text-white' : 'bg-stone-50'}`}>
              <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${COLORS[i]}`} />{t.from_km}–{t.to_km} km</span>
              <span className="font-semibold">{describeTier(t)}</span>
            </li>
          );
        })}
      </ul>

      <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={bigOrder} onChange={e => setBigOrder(e.target.checked)} className="h-4 w-4 accent-brand-600" />
        Belanja ≥ Rp50.000 → gratis ongkir (selama dalam area)
      </label>
    </div>
  );
}
