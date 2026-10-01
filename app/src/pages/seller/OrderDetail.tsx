import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ItemsTable, StatusBadge, Totals } from '../../components/OrderBits';
import { Empty, Sheet, Spinner, toast, TopBar } from '../../components/ui';
import type { AppError } from '../../lib/errors';
import { displayWa, formatDateTime, rupiah, waLink } from '../../lib/format';
import { directionsLink } from '../../lib/geo';
import { useSeller } from '../../lib/seller';
import { getInvoice, saveInvoice } from '../../lib/local';
import { renderInvoicePng, shareImageViaWhatsApp, toInvoice } from '../../lib/receipt';
import { PAYMENT_LABEL, PAYMENT_TONE, sellerActions, STATUS_LABEL } from '../../lib/status';
import type { Order, OrderStatus } from '../../lib/types';

const REJECT_REASONS = ['Stok habis', 'Toko sedang ramai', 'Di luar jangkauan antar', 'Sudah mau tutup'];

function waMessage(o: Order, storeName: string, to: OrderStatus): string {
  const head = `Halo ${o.buyer_name}, pesanan ${o.code} di ${storeName}`;
  switch (to) {
    case 'accepted': return `${head} sudah kami terima 🙏 Total ${rupiah(o.total)}.`;
    case 'delivering': return `${head} sedang diantar 🛵 Mohon siapkan ${o.payment_method === 'cod' ? `uang ${rupiah(o.total)}` : 'bukti transfer'}.`;
    case 'ready_pickup': return `${head} sudah siap diambil 🏪`;
    case 'rejected': return `${head} mohon maaf belum bisa kami proses. Alasan: ${o.reject_reason ?? '-'}`;
    default: return `${head}`;
  }
}

export default function OrderDetail() {
  const { id } = useParams();
  const { orders, store, changeStatus } = useSeller();
  const order = orders.find(o => o.id === id);
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  if (!order) {
    return (
      <>
        <TopBar title="Pesanan" back="/seller" />
        <Empty title="Pesanan tidak ditemukan">Mungkin sudah lebih dari 14 hari.</Empty>
      </>
    );
  }

  const act = async (to: OrderStatus, r?: string) => {
    setBusy(to);
    try {
      await changeStatus(order, to, r);
      toast(`Status: ${STATUS_LABEL[to]}`, 'success');
      setRejectOpen(false);
    } catch (e) {
      toast((e as AppError).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const actions = sellerActions(order.status, order.fulfillment);
  const hasLoc = order.buyer_lat != null && order.buyer_lng != null;

  return (
    <div>
      <TopBar title={`Pesanan ${order.code}`} back="/seller" right={<StatusBadge status={order.status} />} />

      <div className="space-y-3 p-4">
        <section className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-bold">{order.buyer_name}</p>
              <p className="text-sm text-stone-600">{order.buyer_phone ? displayWa(order.buyer_phone) : ''}</p>
              <p className="mt-1 text-xs text-stone-500">{formatDateTime(order.created_at)}</p>
            </div>
            {order.buyer_phone && (
              <a className="btn-wa" href={waLink(order.buyer_phone, waMessage(order, store.name, order.status))} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            )}
          </div>
          <div className="mt-3 rounded-xl bg-stone-50 p-3 text-sm">
            {order.fulfillment === 'delivery' ? (
              <>
                <p className="font-semibold">🛵 Diantar • ±{order.distance_km} km</p>
                <p className="mt-1 text-stone-700">{order.address}</p>
                {hasLoc && (
                  <a className="mt-2 inline-block font-semibold text-brand-600" target="_blank" rel="noreferrer"
                    href={directionsLink({ lat: order.buyer_lat!, lng: order.buyer_lng! })}>
                    Buka rute di Google Maps →
                  </a>
                )}
              </>
            ) : (
              <p className="font-semibold">🏪 Pembeli ambil sendiri</p>
            )}
            <p className="mt-2 text-stone-700">Bayar: <b>{order.payment_method === 'cod' ? 'Tunai saat terima (COD)' : 'Transfer'}</b></p>
          </div>
          {order.note && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">📝 {order.note}</p>}
          {order.reject_reason && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">Alasan ditolak: {order.reject_reason}</p>}
        </section>

        <section className="card p-4">
          <h2 className="mb-1 font-semibold">Pesanan</h2>
          <ItemsTable items={order.order_items ?? []} />
          <div className="mt-3 border-t border-stone-100 pt-3"><Totals order={order} /></div>
        </section>

        {order.status !== 'cancelled' && order.status !== 'rejected' && <PaymentPanel order={order} />}

        {order.status === 'cancelled' && (
          <p className="text-center text-sm text-stone-500">Pesanan dibatalkan oleh pembeli.</p>
        )}
      </div>

      {actions.length > 0 && (
        <div className="sticky bottom-16 z-10 flex gap-2 border-t border-stone-200 bg-white p-3">
          {actions.map(a => (
            <button
              key={a.to}
              disabled={busy !== null}
              onClick={() => (a.to === 'rejected' ? setRejectOpen(true) : act(a.to))}
              className={`${a.primary ? 'btn-primary flex-[2]' : a.danger ? 'btn-danger flex-1' : 'btn-secondary flex-1'} py-3`}
            >
              {busy === a.to && <Spinner className="h-4 w-4" />} {a.label}
            </button>
          ))}
        </div>
      )}

      <Sheet open={rejectOpen} onClose={() => setRejectOpen(false)} title="Tolak pesanan">
        <div className="flex flex-wrap gap-2">
          {REJECT_REASONS.map(r => (
            <button key={r} className={`chip ${reason === r ? 'chip-active' : ''}`} onClick={() => setReason(r)}>{r}</button>
          ))}
        </div>
        <textarea className="input mt-3" rows={2} placeholder="Atau tulis alasan lain" value={reason} onChange={e => setReason(e.target.value)} />
        <button className="btn mt-4 w-full bg-red-600 py-3 text-white" disabled={!reason.trim() || busy !== null}
          onClick={() => act('rejected', reason)}>
          {busy === 'rejected' && <Spinner className="h-4 w-4" />} Tolak pesanan
        </button>
        <p className="hint text-center">Setelah ditolak, kabari pembeli lewat tombol WhatsApp.</p>
      </Sheet>

      <div className="px-4 pb-4 text-center">
        <Link to="/seller" className="text-sm text-stone-500">← Semua pesanan</Link>
      </div>
    </div>
  );
}

export const notaUrl = (o: Order) => `${window.location.origin}/nota/${o.id}?k=${o.track_token}`;

function PaymentPanel({ order }: { order: Order }) {
  const { store, confirmPayment } = useSeller();
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');
  const paid = order.payment_status === 'paid';

  // Salinan nota disimpan di HP penjual begitu lunas
  useEffect(() => {
    if (paid && !getInvoice(order.id)) saveInvoice(toInvoice(order, order.order_items ?? [], store));
  }, [paid, order, store]);

  const run = async (accept: boolean, n?: string) => {
    if (accept && !confirm(order.payment_method === 'cod'
      ? `Sudah terima uang ${rupiah(order.total)} dari ${order.buyer_name}?`
      : 'Uang transfer sudah masuk ke rekening Anda?')) return;
    setBusy(true);
    try {
      await confirmPayment(order, accept, n);
      toast(accept ? 'Lunas — kirim nota ke pembeli lewat WhatsApp' : 'Bukti ditolak — kabari pembeli di WhatsApp', accept ? 'success' : 'info');
      setRejectOpen(false);
    } catch (e) {
      toast((e as AppError).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const sendNota = async () => {
    setSending(true);
    try {
      const inv = getInvoice(order.id) ?? toInvoice(order, order.order_items ?? [], store);
      saveInvoice(inv);
      const blob = await renderInvoicePng(inv);
      const text = `Terima kasih ${order.buyer_name}. Pembayaran pesanan ${order.code} di ${store.name} sudah kami terima. Nota: ${notaUrl(order)}`;
      const res = await shareImageViaWhatsApp(blob, `nota-${inv.invoiceNo}.png`, text, order.buyer_phone);
      if (res === 'fallback') toast('Gambar nota tersimpan — lampirkan di chat WhatsApp pembeli');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSending(false);
    }
  };

  const askProof = order.buyer_phone
    ? waLink(order.buyer_phone, `Halo ${order.buyer_name}, mohon kirim bukti transfer pesanan ${order.code} sebesar ${rupiah(order.total)} ya.`)
    : null;

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Pembayaran • {order.payment_method === 'cod' ? 'COD (tunai)' : 'Transfer'}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_TONE[order.payment_status]}`}>{PAYMENT_LABEL[order.payment_status]}</span>
      </div>

      {order.payment_method === 'transfer' && !paid && (
        <p className="mt-2 text-sm text-stone-600">
          Bukti transfer dikirim pembeli ke <b>WhatsApp Anda</b>. Cek juga mutasi rekening sebelum menandai lunas.
          {askProof && <> <a className="font-semibold text-brand-700" href={askProof} target="_blank" rel="noreferrer">Minta bukti di WA</a></>}
        </p>
      )}
      {order.payment_status === 'rejected' && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          Bukti ditolak: {order.payment_note}. Menunggu pembeli mengirim bukti baru.
        </p>
      )}

      {paid ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-emerald-700">Lunas {order.paid_at ? formatDateTime(order.paid_at) : ''}</p>
          <button className="btn-wa w-full py-3" disabled={sending} onClick={sendNota}>
            {sending && <Spinner className="h-4 w-4" />} Kirim nota ke WA pembeli
          </button>
          <a className="btn-ghost w-full" href={notaUrl(order)} target="_blank" rel="noreferrer">Lihat nota</a>
        </div>
      ) : order.payment_method === 'cod' ? (
        <button className="btn mt-3 w-full bg-emerald-600 py-3 text-white hover:bg-emerald-700" disabled={busy} onClick={() => run(true)}>
          {busy && <Spinner className="h-4 w-4" />} Sudah terima pembayaran {rupiah(order.total)}
        </button>
      ) : order.payment_status === 'pending_verification' ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button className="btn col-span-2 bg-emerald-600 py-3 text-white hover:bg-emerald-700" disabled={busy} onClick={() => run(true)}>
            {busy && <Spinner className="h-4 w-4" />} Pembayaran diterima
          </button>
          <button className="btn-danger py-3" disabled={busy} onClick={() => setRejectOpen(true)}>Tidak valid</button>
        </div>
      ) : null}

      <Sheet open={rejectOpen} onClose={() => setRejectOpen(false)} title="Bukti transfer tidak valid">
        <div className="flex flex-wrap gap-2">
          {['Nominal kurang', 'Dana belum masuk', 'Foto tidak jelas', 'Rekening tujuan salah'].map(r => (
            <button key={r} className={`chip ${note === r ? 'chip-active' : ''}`} onClick={() => setNote(r)}>{r}</button>
          ))}
        </div>
        <textarea className="input mt-3" rows={2} placeholder="Atau tulis alasan lain" value={note} onChange={e => setNote(e.target.value)} />
        <button className="btn mt-4 w-full bg-red-600 py-3 text-white" disabled={!note.trim() || busy} onClick={() => run(false, note)}>
          {busy && <Spinner className="h-4 w-4" />} Tolak bukti
        </button>
        <p className="hint text-center">Pembeli akan diminta mengirim bukti baru.</p>
      </Sheet>
    </section>
  );
}
