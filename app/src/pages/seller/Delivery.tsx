import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { PageLoading, Spinner, toast, Toggle } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { parseIntSafe, rupiah } from '../../lib/format';
import { calcDeliveryFee, maxCoverageKm, sortTiers, validateTiers } from '../../lib/geo';
import { useSeller } from '../../lib/seller';
import { supabase } from '../../lib/supabase';
import type { FeeType, LatLng, Tier } from '../../lib/types';

const MapPicker = lazy(() => import('../../components/MapPicker'));

const FEE_LABEL: Record<FeeType, string> = { free: 'Gratis', flat: 'Per order', per_km: 'Per km' };

export default function Delivery() {
  const { store, setStore } = useSeller();
  const [tiers, setTiers] = useState<Tier[] | null>(null);
  const [deliveryEnabled, setDeliveryEnabled] = useState(store.delivery_enabled);
  const [pickupEnabled, setPickupEnabled] = useState(store.pickup_enabled);
  const [roadFactor, setRoadFactor] = useState(String(store.road_factor));
  const [freeMin, setFreeMin] = useState(store.free_delivery_min_order ? String(store.free_delivery_min_order) : '');
  const [minOrder, setMinOrder] = useState(store.min_order ? String(store.min_order) : '');
  const [testPoint, setTestPoint] = useState<LatLng | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('delivery_tiers').select('*').eq('store_id', store.id).order('from_km').then(({ data, error }) => {
      if (error) toast(toAppError(error).message, 'error');
      setTiers(((data ?? []) as Tier[]).map(t => ({ ...t, from_km: Number(t.from_km), to_km: Number(t.to_km) })));
    });
  }, [store.id]);

  const errors = useMemo(() => (tiers && deliveryEnabled ? validateTiers(tiers) : []), [tiers, deliveryEnabled]);
  const rf = Math.min(2, Math.max(1, Number(roadFactor.replace(',', '.')) || 1.3));

  const test = useMemo(() => {
    if (!testPoint || !tiers || errors.length) return null;
    return calcDeliveryFee(
      { lat: store.lat, lng: store.lng, road_factor: rf, free_delivery_min_order: null, tiers },
      testPoint, 0,
    );
  }, [testPoint, tiers, errors.length, store.lat, store.lng, rf]);

  if (!tiers) return <PageLoading />;

  const update = (i: number, patch: Partial<Tier>) => {
    setTiers(prev => {
      const next = sortTiers(prev!).map((t, k) => (k === i ? { ...t, ...patch } : t));
      // jaga agar "dari" baris berikutnya = "sampai" baris ini
      for (let k = 1; k < next.length; k++) next[k] = { ...next[k], from_km: next[k - 1].to_km };
      return next;
    });
  };

  const addRow = () => {
    const sorted = sortTiers(tiers);
    const from = sorted.at(-1)?.to_km ?? 0;
    setTiers([...sorted, { from_km: from, to_km: Math.min(50, from + 5), fee_type: 'flat', amount: 2000 }]);
  };

  const removeRow = (i: number) => {
    const next = sortTiers(tiers).filter((_, k) => k !== i);
    for (let k = 0; k < next.length; k++) next[k] = { ...next[k], from_km: k === 0 ? 0 : next[k - 1].to_km };
    setTiers(next);
  };

  const save = async () => {
    if (errors.length) return toast(errors[0], 'error');
    if (!deliveryEnabled && !pickupEnabled) return toast('Aktifkan minimal satu: antar atau ambil sendiri', 'error');
    setBusy(true);
    try {
      const settings = {
        delivery_enabled: deliveryEnabled,
        pickup_enabled: pickupEnabled,
        road_factor: rf,
        free_delivery_min_order: parseIntSafe(freeMin),
        min_order: parseIntSafe(minOrder),
      };
      const { error } = await supabase.rpc('save_delivery_settings', {
        p_store_id: store.id,
        p_settings: settings,
        p_tiers: deliveryEnabled ? sortTiers(tiers).map(({ from_km, to_km, fee_type, amount }) => ({ from_km, to_km, fee_type, amount })) : [],
      });
      if (error) throw error;
      const { data } = await supabase.from('stores').select('*').eq('id', store.id).single();
      if (data) setStore(data);
      toast('Pengaturan ongkir disimpan', 'success');
    } catch (e) {
      toast(toAppError(e).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const sorted = sortTiers(tiers);
  const maxKm = maxCoverageKm(sorted);

  return (
    <div className="space-y-4 p-4">
      <section className="card space-y-4 p-4">
        <Toggle label="Layani antar" checked={deliveryEnabled} onChange={setDeliveryEnabled} />
        <Toggle label="Layani ambil sendiri (ongkir Rp0)" checked={pickupEnabled} onChange={setPickupEnabled} />
      </section>

      {deliveryEnabled && (
        <section className="card p-4">
          <h2 className="font-semibold">Tarif berdasarkan jarak</h2>
          <p className="hint !mt-0.5">Jarak dihitung dari titik toko ke titik pembeli.</p>
          <div className="mt-3 space-y-3">
            {sorted.map((t, i) => (
              <div key={i} className="rounded-xl border border-stone-200 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-14 shrink-0 text-stone-600">{t.from_km} km –</span>
                  <input className="input !w-20 !py-1.5 text-center" inputMode="decimal" value={t.to_km}
                    onChange={e => update(i, { to_km: Number(e.target.value.replace(',', '.')) || 0 })} />
                  <span className="text-stone-600">km</span>
                  {sorted.length > 1 && (
                    <button className="ml-auto text-sm text-red-600" onClick={() => removeRow(i)}>Hapus</button>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <select className="input !py-1.5" value={t.fee_type} onChange={e => update(i, { fee_type: e.target.value as FeeType })}>
                    {(Object.keys(FEE_LABEL) as FeeType[]).map(f => <option key={f} value={f}>{FEE_LABEL[f]}</option>)}
                  </select>
                  {t.fee_type !== 'free' && (
                    <input className="input !py-1.5" inputMode="numeric" placeholder="Nominal" value={t.amount || ''}
                      onChange={e => update(i, { amount: parseIntSafe(e.target.value) })} />
                  )}
                </div>
                {t.fee_type === 'per_km' && t.amount > 0 && (
                  <p className="hint">Contoh {Math.ceil(t.to_km)} km → {rupiah(Math.ceil(t.to_km) * t.amount)}</p>
                )}
              </div>
            ))}
          </div>
          {sorted.length < 10 && <button className="btn-secondary mt-3 w-full" onClick={addRow}>+ Tambah tingkat</button>}
          {errors.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {errors.map(e => <li key={e}>• {e}</li>)}
            </ul>
          )}
          <p className="mt-3 text-sm text-stone-600">Di atas <b>{maxKm} km</b> pesanan antar tidak bisa dibuat.</p>
        </section>
      )}

      <section className="card space-y-4 p-4">
        <div>
          <label className="label" htmlFor="minorder">Minimal belanja (opsional)</label>
          <input id="minorder" className="input" inputMode="numeric" placeholder="Kosongkan bila tidak ada" value={minOrder}
            onChange={e => setMinOrder(e.target.value.replace(/[^0-9]/g, ''))} />
        </div>
        {deliveryEnabled && (
          <>
            <div>
              <label className="label" htmlFor="freemin">Gratis ongkir bila belanja minimal (opsional)</label>
              <input id="freemin" className="input" inputMode="numeric" placeholder="mis. 50000" value={freeMin}
                onChange={e => setFreeMin(e.target.value.replace(/[^0-9]/g, ''))} />
              <p className="hint">Hanya berlaku di dalam area antar.</p>
            </div>
            <div>
              <label className="label" htmlFor="rf">Faktor jalan</label>
              <input id="rf" className="input !w-28" inputMode="decimal" value={roadFactor} onChange={e => setRoadFactor(e.target.value)} />
              <p className="hint">Jarak garis lurus × faktor ini ≈ jarak tempuh. Default 1,3 (antara 1,0–2,0).</p>
            </div>
          </>
        )}
      </section>

      {deliveryEnabled && errors.length === 0 && (
        <section className="card p-4">
          <h2 className="font-semibold">Coba hitung ongkir</h2>
          <p className="hint !mt-0.5 mb-3">Ketuk peta di titik mana saja untuk melihat ongkirnya.</p>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-200" />}>
            <MapPicker value={testPoint} onChange={setTestPoint} store={{ lat: store.lat, lng: store.lng }}
              radiusKm={maxKm / rf} showLocate={false} />
          </Suspense>
          {test && (
            <p className={`mt-3 rounded-xl p-3 text-sm font-medium ${test.inCoverage ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              ±{test.distanceKm} km → {test.inCoverage ? (test.fee ? rupiah(test.fee) : 'Gratis ongkir') : 'Di luar jangkauan'}
            </p>
          )}
        </section>
      )}

      <button className="btn-primary sticky bottom-20 w-full py-3 shadow-lg" onClick={save} disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />} Simpan pengaturan
      </button>
    </div>
  );
}
