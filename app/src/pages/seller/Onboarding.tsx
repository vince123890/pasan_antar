import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Spinner, toast } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { normalizeWa, slugify } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import type { LatLng, Store, StoreCategory } from '../../lib/types';

const MapPicker = lazy(() => import('../../components/MapPicker'));

const DEFAULT_TIERS = [
  { from_km: 0, to_km: 3, fee_type: 'free', amount: 0 },
  { from_km: 3, to_km: 5, fee_type: 'flat', amount: 2000 },
];

export function useStoreCategories() {
  const [cats, setCats] = useState<StoreCategory[]>([]);
  useEffect(() => {
    supabase.from('store_categories').select('*').order('sort').then(({ data }) => setCats((data ?? []) as StoreCategory[]));
  }, []);
  return cats;
}

export default function Onboarding({ onCreated }: { onCreated: (s: Store) => void }) {
  const cats = useStoreCategories();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('warung_kelontong');
  const [wa, setWa] = useState('');
  const [address, setAddress] = useState('');
  const [loc, setLoc] = useState<LatLng | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const phone = normalizeWa(wa);
    if (!phone) return toast('Nomor WhatsApp tidak valid', 'error');
    if (!loc) return toast('Tentukan lokasi toko di peta', 'error');
    const base = slugify(name) || 'toko';
    setBusy(true);
    try {
      let store: Store | null = null;
      for (let i = 0; i < 4 && !store; i++) {
        const slug = (i === 0 ? base : `${base.slice(0, 35)}-${Math.floor(100 + Math.random() * 900)}`).padEnd(3, '0');
        const { data, error } = await supabase
          .from('stores')
          .insert({ slug, name: name.trim(), category_code: category, wa_phone: phone, address: address.trim() || null, lat: loc.lat, lng: loc.lng })
          .select()
          .single();
        if (!error) store = data as Store;
        else if (error.code !== '23505') throw error;
      }
      if (!store) throw new Error('Gagal membuat link toko, coba nama lain');
      await supabase.rpc('save_delivery_settings', { p_store_id: store.id, p_settings: {}, p_tiers: DEFAULT_TIERS });
      toast('Toko berhasil dibuat 🎉', 'success');
      onCreated(store);
    } catch (err) {
      toast(toAppError(err).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => supabase.auth.signOut();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Buat toko Anda</h1>
          <p className="mt-1 text-sm text-stone-600">Isi data singkat ini. Semua bisa diubah nanti.</p>
        </div>
        <button onClick={logout} className="text-sm text-stone-500">Keluar</button>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="label" htmlFor="name">Nama toko</label>
          <input id="name" className="input" required minLength={2} maxLength={80} placeholder="mis. Warung Bu Sri"
            value={name} onChange={e => setName(e.target.value)} />
          {name && <p className="hint">Link toko: /t/{slugify(name) || '…'}</p>}
        </div>

        <div>
          <label className="label" htmlFor="cat">Jenis usaha</label>
          <select id="cat" className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {cats.map(c => <option key={c.code} value={c.code}>{c.icon} {c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="wa">Nomor WhatsApp toko</label>
          <input id="wa" className="input" required inputMode="tel" placeholder="08xxxxxxxxxx"
            value={wa} onChange={e => setWa(e.target.value)} />
          <p className="hint">Pembeli bisa menghubungi Anda lewat nomor ini.</p>
        </div>

        <div>
          <label className="label">Lokasi toko</label>
          <p className="hint mb-2 !mt-0">Ongkir dihitung dari titik ini. Ketuk peta atau geser pin ke lokasi toko.</p>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-200" />}>
            <MapPicker value={loc} onChange={setLoc} autoLocate />
          </Suspense>
        </div>

        <div>
          <label className="label" htmlFor="addr">Alamat (opsional)</label>
          <textarea id="addr" className="input" rows={2} placeholder="Jl. Melati No. 5, dekat masjid"
            value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
          Tarif ongkir awal: <b>0–3 km gratis</b>, <b>3–5 km Rp2.000</b>. Bisa diubah di menu Ongkir.
        </p>

        <button className="btn-primary w-full py-3" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} Buat toko
        </button>
      </form>
    </div>
  );
}
