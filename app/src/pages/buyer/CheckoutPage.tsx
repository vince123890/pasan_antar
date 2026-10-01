import { lazy, Suspense, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PhotoPicker } from '../../components/PhotoPicker';
import { OfflineBanner, PageLoading, Spinner, toast, TopBar, useOnline } from '../../components/ui';
import { useCatalog } from '../../lib/catalog';
import { toAppError } from '../../lib/errors';
import { normalizeWa, rupiah } from '../../lib/format';
import { calcDeliveryFee, maxCoverageKm } from '../../lib/geo';
import { addMyOrder, clearCart, getProfile, saveProfile, saveProof, setLineNote, setQty, useCart } from '../../lib/local';
import { fileToDataUrl } from '../../lib/media';
import { ensureBuyerSession, supabase } from '../../lib/supabase';
import type { Catalog, Fulfillment, LatLng, Order, PaymentMethod } from '../../lib/types';

const MapPicker = lazy(() => import('../../components/MapPicker'));

export default function CheckoutPage() {
  const { slug = '' } = useParams();
  const { catalog, loading, reload } = useCatalog(slug);
  if (!catalog) return loading ? <PageLoading /> : <Navigate to={`/t/${slug}`} replace />;
  return <Checkout catalog={catalog} reload={reload} />;
}

function Checkout({ catalog, reload }: { catalog: Catalog; reload: () => Promise<Catalog | null> }) {
  const { store, tiers, products } = catalog;
  const navigate = useNavigate();
  const online = useOnline();
  const cart = useCart(store.id);
  const profile = useMemo(getProfile, []);

  const [fulfillment, setFulfillment] = useState<Fulfillment>(store.delivery_enabled ? 'delivery' : 'pickup');
  const [loc, setLoc] = useState<LatLng | null>(profile.location);
  const [address, setAddress] = useState(profile.address);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const clientRef = useRef(crypto.randomUUID());

  const byId = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const lines = cart
    .map(l => ({ ...l, product: byId.get(l.product_id) }))
    .filter((l): l is typeof l & { product: NonNullable<typeof l.product> } => !!l.product && l.product.is_available);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.product.price, 0);

  const fee = useMemo(() => {
    if (fulfillment !== 'delivery' || !loc) return null;
    return calcDeliveryFee({ ...store, tiers }, loc, subtotal);
  }, [fulfillment, loc, store, tiers, subtotal]);

  if (lines.length === 0) return <Navigate to={`/t/${store.slug}`} replace />;

  const deliveryFee = fulfillment === 'delivery' && fee?.inCoverage ? fee.fee : 0;
  const total = subtotal + deliveryFee;
  const belowMin = store.min_order != null && subtotal < store.min_order;
  const outOfCoverage = fulfillment === 'delivery' && fee != null && !fee.inCoverage;
  const needLocation = fulfillment === 'delivery' && !loc;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const wa = normalizeWa(phone);
    if (!wa) return toast('Nomor WhatsApp tidak valid', 'error');
    if (needLocation) return toast('Tentukan lokasi pengantaran di peta', 'error');
    if (outOfCoverage || belowMin) return;
    if (payment === 'transfer' && !proof) return toast('Lampirkan foto bukti transfer dulu', 'error');
    setBusy(true);
    try {
      // Bukti transfer hanya disimpan di HP ini, lalu dikirim ke penjual lewat WhatsApp
      const proofDataUrl = payment === 'transfer' && proof ? await fileToDataUrl(proof) : null;
      await ensureBuyerSession();
      const { data, error } = await supabase.rpc('place_order', {
        p_store_id: store.id,
        p_client_ref: clientRef.current,
        p_items: lines.map(l => ({ product_id: l.product_id, qty: l.qty, note: l.note ?? null })),
        p_fulfillment: fulfillment,
        p_payment: payment,
        p_buyer_name: name.trim(),
        p_buyer_phone: wa,
        p_address: fulfillment === 'delivery' ? address.trim() : null,
        p_lat: fulfillment === 'delivery' ? loc!.lat : null,
        p_lng: fulfillment === 'delivery' ? loc!.lng : null,
        p_note: note.trim() || null,
        p_expected_total: total,
      });
      if (error) throw error;
      const order = data as Order;
      saveProfile({ name: name.trim(), phone: wa, address: address.trim(), location: loc });
      addMyOrder({
        id: order.id, code: order.code, track_token: order.track_token!, store_name: store.name,
        store_slug: store.slug, total: order.total, created_at: order.created_at,
      });
      if (proofDataUrl) saveProof(order.id, proofDataUrl);
      clearCart(store.id);
      navigate(`/o/${order.id}?k=${order.track_token}&baru=1`, { replace: true });
    } catch (err) {
      const e2 = toAppError(err);
      toast(e2.message, 'error');
      if (['PRICE_CHANGED', 'PRODUCT_UNAVAILABLE', 'STORE_CLOSED', 'DELIVERY_DISABLED', 'OUT_OF_COVERAGE'].includes(e2.code ?? '')) {
        await reload();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-32">
      <OfflineBanner />
      <TopBar title="Checkout" back={`/t/${store.slug}`} />
      <form id="checkout" onSubmit={submit} className="space-y-4 p-4">
        <section className="card p-4">
          <h2 className="font-semibold">{store.name}</h2>
          <ul className="mt-2 divide-y divide-stone-100">
            {lines.map(l => (
              <li key={l.product_id} className="py-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{l.product.name}</p>
                    <p className="text-sm text-stone-600 tabular-nums">{rupiah(l.product.price * l.qty)}</p>
                  </div>
                  <div className="flex items-center rounded-xl border border-stone-300">
                    <button type="button" className="h-8 w-8 font-bold" onClick={() => setQty(store.id, l.product_id, l.qty - 1)}>−</button>
                    <span className="w-6 text-center text-sm font-bold">{l.qty}</span>
                    <button type="button" className="h-8 w-8 font-bold" onClick={() => setQty(store.id, l.product_id, l.qty + 1)}>+</button>
                  </div>
                </div>
                <input className="mt-2 w-full border-0 border-b border-dashed border-stone-200 bg-transparent px-0 py-1 text-sm outline-none placeholder:text-stone-400"
                  placeholder="Catatan (mis. pedas, tanpa bawang)" value={l.note ?? ''} maxLength={120}
                  onChange={e => setLineNote(store.id, l.product_id, e.target.value)} />
              </li>
            ))}
          </ul>
          <Link to={`/t/${store.slug}`} className="mt-2 inline-block text-sm font-semibold text-brand-700">+ Tambah lagi</Link>
        </section>

        {store.delivery_enabled && store.pickup_enabled && (
          <section className="grid grid-cols-2 gap-2">
            {(['delivery', 'pickup'] as const).map(f => (
              <button type="button" key={f} onClick={() => setFulfillment(f)}
                className={`card p-3 text-left ${fulfillment === f ? '!border-brand-600 ring-2 ring-brand-100' : ''}`}>
                <p className="text-xl">{f === 'delivery' ? '🛵' : '🏪'}</p>
                <p className="mt-1 font-semibold">{f === 'delivery' ? 'Diantar' : 'Ambil sendiri'}</p>
                <p className="text-xs text-stone-500">{f === 'delivery' ? 'Ongkir sesuai jarak' : 'Tanpa ongkir'}</p>
              </button>
            ))}
          </section>
        )}

        {fulfillment === 'delivery' && (
          <section className="card space-y-3 p-4">
            <h2 className="font-semibold">Lokasi pengantaran</h2>
            <p className="hint !mt-0">Ketuk peta / geser pin oranye ke rumah Anda. Pin hitam = toko.</p>
            <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-200" />}>
              <MapPicker value={loc} onChange={setLoc} store={{ lat: store.lat, lng: store.lng }}
                radiusKm={maxCoverageKm(tiers) / Number(store.road_factor)} autoLocate={!loc} />
            </Suspense>
            {fee && (
              <p className={`rounded-xl p-3 text-sm font-medium ${fee.inCoverage ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                {fee.inCoverage
                  ? <>Jarak ±{fee.distanceKm} km → ongkir {fee.fee ? rupiah(fee.fee) : 'GRATIS'}{fee.freeByMinOrder && ' (gratis karena min. belanja)'}</>
                  : <>Jarak ±{fee.distanceKm} km — di luar area antar (maks. {fee.maxKm} km).{store.pickup_enabled && ' Pilih "Ambil sendiri".'}</>}
              </p>
            )}
            <div>
              <label className="label" htmlFor="addr">Alamat lengkap & patokan</label>
              <textarea id="addr" className="input" rows={2} required placeholder="Jl. Mawar No. 3, pagar hijau, sebelah warung bakso"
                value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </section>
        )}

        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Data pemesan</h2>
          <div>
            <label className="label" htmlFor="bname">Nama</label>
            <input id="bname" className="input" required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="bphone">Nomor WhatsApp</label>
            <input id="bphone" className="input" required inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)} />
            <p className="hint">Penjual akan menghubungi lewat nomor ini.</p>
          </div>
          <div>
            <label className="label" htmlFor="bnote">Catatan untuk penjual (opsional)</label>
            <input id="bnote" className="input" maxLength={200} value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </section>

        <section className="card space-y-2 p-4">
          <h2 className="font-semibold">Pembayaran</h2>
          <label className="flex items-center gap-3 py-1">
            <input type="radio" name="pay" checked={payment === 'cod'} onChange={() => setPayment('cod')} className="h-4 w-4 accent-brand-600" />
            <span>💵 Tunai saat {fulfillment === 'delivery' ? 'barang tiba' : 'ambil'}</span>
          </label>
          {store.bank_info && (
            <label className="flex items-start gap-3 py-1">
              <input type="radio" name="pay" checked={payment === 'transfer'} onChange={() => setPayment('transfer')} className="mt-1 h-4 w-4 accent-brand-600" />
              <span>
                🏦 Transfer
              </span>
            </label>
          )}
          {store.bank_info && payment === 'transfer' && (
            <div className="space-y-3 rounded-xl bg-stone-50 p-3">
              <p className="text-sm">Transfer <b>{rupiah(total)}</b> ke:</p>
              <p className="rounded-lg bg-white p-2 text-sm font-semibold whitespace-pre-line text-stone-800">{store.bank_info}</p>
              <div>
                <p className="label">Bukti transfer <span className="text-red-600">*</span></p>
                <PhotoPicker file={proof} label="Bukti transfer" aspect="portrait" required onPick={setProof} onClear={() => setProof(null)} />
                <p className="hint">Foto layar m-banking / e-wallet atau struk ATM. Disimpan di HP Anda, lalu dikirim ke WhatsApp penjual setelah pesan.</p>
              </div>
            </div>
          )}
        </section>

        <section className="card space-y-1.5 p-4 text-sm">
          <div className="flex justify-between"><span className="text-stone-600">Subtotal</span><span className="tabular-nums">{rupiah(subtotal)}</span></div>
          <div className="flex justify-between">
            <span className="text-stone-600">Ongkir</span>
            <span className="tabular-nums">
              {fulfillment === 'pickup' ? 'Rp0' : fee?.inCoverage ? (fee.fee ? rupiah(fee.fee) : 'Gratis') : '—'}
            </span>
          </div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold">
            <span>Total</span><span className="tabular-nums">{rupiah(total)}</span>
          </div>
          {belowMin && <p className="pt-1 text-red-600">Minimal belanja {rupiah(store.min_order)}.</p>}
        </section>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-stone-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button form="checkout" className="btn-primary w-full rounded-2xl py-4 text-base"
          disabled={busy || !online || !store.is_open || belowMin || outOfCoverage || needLocation || (payment === 'transfer' && !proof)}>
          {busy && <Spinner className="h-4 w-4" />}
          {!online ? 'Tidak ada koneksi' : !store.is_open ? 'Toko sedang tutup' : needLocation ? 'Tentukan lokasi dulu' : payment === 'transfer' && !proof ? 'Lampirkan bukti transfer' : `Pesan • ${rupiah(total)}`}
        </button>
      </div>
    </div>
  );
}
