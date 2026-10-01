import { lazy, Suspense, useState, type FormEvent } from 'react';
import { PhotoPicker } from '../../components/PhotoPicker';
import { Spinner, toast } from '../../components/ui';
import type { AppError } from '../../lib/errors';
import { toAppError } from '../../lib/errors';
import { displayWa, normalizeWa } from '../../lib/format';
import { setPref } from '../../lib/local';
import { uploadStoreImage } from '../../lib/media';
import { useSeller } from '../../lib/seller';
import { supabase } from '../../lib/supabase';
import type { LatLng } from '../../lib/types';
import { useStoreCategories } from './Onboarding';

const MapPicker = lazy(() => import('../../components/MapPicker'));

export default function StoreSettings() {
  const { store, updateStore, session } = useSeller();
  const cats = useStoreCategories();
  const [name, setName] = useState(store.name);
  const [category, setCategory] = useState(store.category_code);
  const [description, setDescription] = useState(store.description ?? '');
  const [wa, setWa] = useState(displayWa(store.wa_phone));
  const [address, setAddress] = useState(store.address ?? '');
  const [bankInfo, setBankInfo] = useState(store.bank_info ?? '');
  const [loc, setLoc] = useState<LatLng>({ lat: store.lat, lng: store.lng });
  const [busy, setBusy] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const phone = normalizeWa(wa);
    if (!phone) return toast('Nomor WhatsApp tidak valid', 'error');
    setBusy(true);
    try {
      await updateStore({
        name: name.trim(),
        category_code: category,
        description: description.trim() || null,
        wa_phone: phone,
        address: address.trim() || null,
        bank_info: bankInfo.trim() || null,
        lat: loc.lat,
        lng: loc.lng,
      });
      toast('Profil toko disimpan', 'success');
    } catch (err) {
      toast((err as AppError).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const changeLogo = async (file: File | undefined) => {
    if (!file) return;
    setLogoBusy(true);
    try {
      const url = await uploadStoreImage(store.id, file, 'logo');
      await updateStore({ logo_url: url });
      toast('Logo diperbarui', 'success');
    } catch (err) {
      toast(toAppError(err).message, 'error');
    } finally {
      setLogoBusy(false);
    }
  };

  const logout = async () => {
    if (!confirm('Keluar dari akun penjual?')) return;
    setPref('seller_store', null);
    await supabase.auth.signOut();
  };

  return (
    <div className="p-4">
      <form onSubmit={save} className="space-y-4">
        <section className="card p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold">Logo toko {logoBusy && <Spinner className="h-4 w-4" />}</p>
          <PhotoPicker file={null} existingUrl={store.logo_url} label="Logo" onPick={changeLogo} />
        </section>

        <section className="card space-y-4 p-4">
          <div>
            <label className="label" htmlFor="sname">Nama toko</label>
            <input id="sname" className="input" required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} />
            <p className="hint">Link toko tetap: /t/{store.slug}</p>
          </div>
          <div>
            <label className="label" htmlFor="scat">Jenis usaha</label>
            <select id="scat" className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {cats.map(c => <option key={c.code} value={c.code}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="sdesc">Deskripsi singkat</label>
            <textarea id="sdesc" className="input" rows={2} placeholder="mis. Sedia sembako, gas, galon. Antar cepat!"
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="swa">Nomor WhatsApp</label>
            <input id="swa" className="input" inputMode="tel" required value={wa} onChange={e => setWa(e.target.value)} />
          </div>
        </section>

        <section className="card space-y-4 p-4">
          <div>
            <label className="label">Lokasi toko</label>
            <Suspense fallback={<div className="h-56 animate-pulse rounded-2xl bg-stone-200" />}>
              <MapPicker value={loc} onChange={setLoc} height="h-56" />
            </Suspense>
          </div>
          <div>
            <label className="label" htmlFor="saddr">Alamat</label>
            <textarea id="saddr" className="input" rows={2} value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </section>

        <section className="card space-y-2 p-4">
          <p className="font-semibold">Pembayaran</p>
          <p className="text-sm text-stone-600">Tunai saat terima (COD) selalu aktif.</p>
          <label className="label !mt-3" htmlFor="bank">Info transfer (opsional)</label>
          <textarea id="bank" className="input" rows={2} placeholder="mis. BCA 1234567890 a.n. Sri Wahyuni / DANA 0812…"
            value={bankInfo} onChange={e => setBankInfo(e.target.value)} />
          <p className="hint">Jika diisi, pembeli bisa memilih bayar transfer dan melihat info ini.</p>
        </section>

        <button className="btn-primary w-full py-3" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Simpan</button>
      </form>

      <div className="mt-8 space-y-2 text-center text-sm text-stone-500">
        <p>Masuk sebagai {session.user.email}</p>
        <button onClick={logout} className="font-semibold text-red-600">Keluar</button>
      </div>
    </div>
  );
}
