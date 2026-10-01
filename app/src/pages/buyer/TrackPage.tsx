import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ItemsTable, StatusBadge, Timeline, Totals } from '../../components/OrderBits';
import { PhotoPicker } from '../../components/PhotoPicker';
import { Empty, OfflineBanner, PageLoading, Spinner, toast, TopBar } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { formatDateTime, rupiah, waLink } from '../../lib/format';
import { findMyOrder, getInvoice, saveInvoice, saveProof, useProofs } from '../../lib/local';
import { dataUrlToBlob, fileToDataUrl } from '../../lib/media';
import { downloadBlob, renderInvoicePng, shareImageViaWhatsApp, toInvoice } from '../../lib/receipt';
import { FINAL, PAYMENT_LABEL, PAYMENT_TONE, STATUS_LABEL } from '../../lib/status';
import { ensureBuyerSession, supabase } from '../../lib/supabase';
import type { Order, OrderItem } from '../../lib/types';

interface Tracked {
  order: Order;
  items: OrderItem[];
  store: { name: string; slug: string; wa_phone: string; bank_info: string | null; address?: string | null; logo_url?: string | null };
}

const HEADLINE: Partial<Record<Order['status'], string>> = {
  pending: 'Menunggu penjual mengonfirmasi…',
  accepted: 'Pesanan diterima penjual 👍',
  preparing: 'Pesanan sedang disiapkan 🍳',
  delivering: 'Pesanan dalam perjalanan 🛵',
  ready_pickup: 'Pesanan siap diambil di toko 🏪',
  completed: 'Pesanan selesai. Terima kasih! 🙏',
  rejected: 'Maaf, pesanan ditolak penjual',
  cancelled: 'Pesanan dibatalkan',
};

export default function TrackPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const mine = findMyOrder(id);
  const token = params.get('k') ?? mine?.track_token ?? '';
  const isNew = params.get('baru') === '1';
  const [data, setData] = useState<Tracked | null | undefined>(undefined);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    const { data: res, error } = await supabase.rpc('get_order_by_token', { p_order_id: id, p_token: token });
    if (error) {
      if (navigator.onLine) toast(toAppError(error).message, 'error');
      setData(prev => prev ?? null);
      return;
    }
    setData((res as Tracked | null) ?? null);
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  const status = data?.order.status;
  const isFinal = status ? FINAL.includes(status) : false;
  // Tetap pantau pesanan selesai yang belum lunas (COD sering dikonfirmasi setelah barang diterima)
  const stopLive = isFinal && (status !== 'completed' || data?.order.payment_status === 'paid');

  // Realtime (bila sesi ini pemilik pesanan) + polling cadangan
  useEffect(() => {
    if (!data || stopLive) return;
    const ch = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, () => load())
      .subscribe();
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), 15_000);
    window.addEventListener('online', load);
    return () => {
      supabase.removeChannel(ch);
      clearInterval(timer);
      window.removeEventListener('online', load);
    };
  }, [id, !!data, stopLive, load]); // eslint-disable-line react-hooks/exhaustive-deps

  if (data === undefined) return <PageLoading />;
  if (data === null) {
    return (
      <div className="mx-auto max-w-lg">
        <TopBar title="Lacak pesanan" back="/pesanan" />
        <Empty icon="🔍" title="Pesanan tidak ditemukan">Link pelacakan tidak valid.</Empty>
      </div>
    );
  }

  const { order, items, store } = data;

  const cancel = async () => {
    if (!confirm('Batalkan pesanan ini?')) return;
    setCancelling(true);
    const { error } = await supabase.rpc('update_order_status', { p_order_id: order.id, p_from: 'pending', p_to: 'cancelled', p_reason: null });
    setCancelling(false);
    if (error) return toast(toAppError(error).message, 'error');
    toast('Pesanan dibatalkan');
    load();
  };

  const waText = `Halo ${store.name}, saya ${order.buyer_name} baru pesan ${order.code} (total ${rupiah(order.total)}). Mohon diproses ya 🙏`;

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-10">
      <OfflineBanner />
      <TopBar title={`Pesanan ${order.code}`} back="/pesanan" right={<StatusBadge status={order.status} />} />

      <div className="space-y-4 p-4">
        <section className="card p-5 text-center">
          <p className="text-sm text-stone-500">{store.name}</p>
          <p className="mt-1 text-xl font-bold">{HEADLINE[order.status] ?? STATUS_LABEL[order.status]}</p>
          {order.status === 'rejected' && order.reject_reason && <p className="mt-2 text-sm text-red-700">Alasan: {order.reject_reason}</p>}
          {order.status === 'pending' && (
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-stone-500"><Spinner className="h-4 w-4" /> Halaman ini diperbarui otomatis</p>
          )}
        </section>

        {(isNew || order.status === 'pending') && (
          <a className="btn-wa w-full py-3" href={waLink(store.wa_phone, waText)} target="_blank" rel="noreferrer">
            Kabari penjual lewat WhatsApp
          </a>
        )}

        {!isFinal && (
          <section className="card p-4"><Timeline order={order} /></section>
        )}

        <section className="card p-4">
          <p className="mb-1 text-xs text-stone-500">{formatDateTime(order.created_at)} • {order.fulfillment === 'delivery' ? 'Diantar' : 'Ambil sendiri'}</p>
          {order.address && <p className="mb-2 text-sm text-stone-700">📍 {order.address}</p>}
          <ItemsTable items={items} />
          <div className="mt-3 border-t border-stone-100 pt-3"><Totals order={order} /></div>
        </section>

        {order.status !== 'cancelled' && order.status !== 'rejected' && (
          <BuyerPayment order={order} items={items} store={store} isMine={!!mine} token={token} onChanged={load} />
        )}

        <div className="flex gap-2">
          <a className="btn-secondary flex-1" href={waLink(store.wa_phone, `Halo ${store.name}, tentang pesanan ${order.code}…`)} target="_blank" rel="noreferrer">
            Chat penjual
          </a>
          <Link className="btn-secondary flex-1" to={`/t/${store.slug}`}>Pesan lagi</Link>
        </div>

        {order.status === 'pending' && mine && (
          <button className="btn-danger w-full" onClick={cancel} disabled={cancelling}>
            {cancelling && <Spinner className="h-4 w-4" />} Batalkan pesanan
          </button>
        )}
      </div>
    </div>
  );
}

function BuyerPayment({ order, items, store, isMine, token, onChanged }: {
  order: Order; items: OrderItem[]; store: Tracked['store']; isMine: boolean; token: string; onChanged: () => void;
}) {
  const proofs = useProofs();
  const proof = proofs.find(p => p.orderId === order.id);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const paid = order.payment_status === 'paid';

  // Nota disimpan di HP pembeli begitu pesanan lunas
  useEffect(() => {
    if (paid && !getInvoice(order.id)) saveInvoice(toInvoice(order, items, store));
  }, [paid, order, items, store]);

  const proofText = `Halo ${store.name}, ini bukti transfer pesanan ${order.code} sebesar ${rupiah(order.total)} a.n. ${order.buyer_name}.`;

  const sendProof = async (dataUrl: string) => {
    const blob = await dataUrlToBlob(dataUrl);
    const res = await shareImageViaWhatsApp(blob, `bukti-${order.code}.jpg`, proofText, store.wa_phone);
    if (res === 'fallback') toast('Gambar bukti tersimpan — lampirkan di chat WhatsApp yang terbuka');
  };

  const pickNew = async (f: File) => {
    setFile(f);
    saveProof(order.id, await fileToDataUrl(f));
  };

  const markResent = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('resubmit_payment', { p_order_id: order.id });
    setBusy(false);
    if (error) return toast(toAppError(error).message, 'error');
    toast('Penjual akan mengecek bukti baru Anda', 'success');
    setFile(null);
    onChanged();
  };

  const saveNotaImage = async () => {
    const inv = getInvoice(order.id) ?? toInvoice(order, items, store);
    downloadBlob(await renderInvoicePng(inv), `nota-${inv.invoiceNo}.png`);
    toast('Gambar nota tersimpan di HP', 'success');
  };

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Pembayaran • {order.payment_method === 'cod' ? 'Tunai' : 'Transfer'}</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_TONE[order.payment_status]}`}>
          {order.payment_status === 'pending_verification' ? 'Dicek penjual' : PAYMENT_LABEL[order.payment_status]}
        </span>
      </div>

      {paid ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-emerald-700">Lunas {order.paid_at ? formatDateTime(order.paid_at) : ''}. Nota juga dikirim penjual lewat WhatsApp.</p>
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/nota/${order.id}?k=${token}`} className="btn-primary">Lihat nota</Link>
            <button className="btn-secondary" onClick={saveNotaImage}>Simpan gambar</button>
          </div>
        </div>
      ) : order.payment_method === 'cod' ? (
        <p className="mt-2 text-sm text-stone-600">
          Siapkan uang <b>{rupiah(order.total)}</b> saat {order.fulfillment === 'delivery' ? 'barang tiba' : 'mengambil pesanan'}.
          Setelah penjual menerima pembayaran, nota dikirim ke WhatsApp Anda.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {order.payment_status === 'rejected' && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">Bukti transfer ditolak: <b>{order.payment_note}</b>. Kirim bukti yang benar.</p>
          )}
          {store.bank_info && <p className="rounded-lg bg-stone-50 p-2 text-sm whitespace-pre-line">{store.bank_info}</p>}

          {proof && order.payment_status !== 'rejected' && (
            <div className="flex items-center gap-3">
              <img src={proof.dataUrl} alt="Bukti transfer" className="h-20 w-16 rounded-lg border border-stone-200 object-cover" />
              <p className="text-xs text-stone-500">Bukti tersimpan di HP ini.</p>
            </div>
          )}

          {order.payment_status === 'rejected' && isMine && (
            <PhotoPicker file={file} label="Bukti baru" aspect="portrait" required onPick={pickNew} onClear={() => setFile(null)} />
          )}

          {proof ? (
            <button className="btn-wa w-full py-3" onClick={() => sendProof(proof.dataUrl)}>Kirim bukti ke WA penjual</button>
          ) : !isMine ? (
            <p className="text-sm text-stone-600">Buka halaman ini dari HP yang dipakai memesan untuk mengirim bukti transfer.</p>
          ) : order.payment_status !== 'rejected' && (
            <PhotoPicker file={file} label="Bukti transfer" aspect="portrait" required onPick={pickNew} onClear={() => setFile(null)} />
          )}

          {order.payment_status === 'rejected' && isMine && (
            <button className="btn-secondary w-full" disabled={!proof || busy} onClick={markResent}>
              {busy && <Spinner className="h-4 w-4" />} Saya sudah kirim bukti baru
            </button>
          )}
          {order.payment_status === 'pending_verification' && (
            <p className="text-xs text-stone-500">Penjual mengecek bukti di WhatsApp lalu menandai pesanan lunas di aplikasi.</p>
          )}
        </div>
      )}
    </section>
  );
}
