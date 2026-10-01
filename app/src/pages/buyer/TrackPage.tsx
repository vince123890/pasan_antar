import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ItemsTable, StatusBadge, Timeline, Totals } from '../../components/OrderBits';
import { Empty, OfflineBanner, PageLoading, Spinner, toast, TopBar } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { formatDateTime, rupiah, waLink } from '../../lib/format';
import { findMyOrder } from '../../lib/local';
import { FINAL, STATUS_LABEL } from '../../lib/status';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem } from '../../lib/types';

interface Tracked {
  order: Order;
  items: OrderItem[];
  store: { name: string; slug: string; wa_phone: string; bank_info: string | null };
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

  // Realtime (bila sesi ini pemilik pesanan) + polling cadangan
  useEffect(() => {
    if (!data || isFinal) return;
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
  }, [id, !!data, isFinal, load]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <p className="mt-3 text-sm text-stone-600">
            Bayar: <b>{order.payment_method === 'cod' ? 'Tunai' : 'Transfer'}</b>
          </p>
          {order.payment_method === 'transfer' && store.bank_info && (
            <p className="mt-1 rounded-lg bg-stone-50 p-2 text-sm whitespace-pre-line">{store.bank_info}</p>
          )}
        </section>

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
