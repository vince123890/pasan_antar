import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ItemsTable, StatusBadge, Totals } from '../../components/OrderBits';
import { Empty, Sheet, Spinner, toast, TopBar } from '../../components/ui';
import type { AppError } from '../../lib/errors';
import { displayWa, formatDateTime, rupiah, waLink } from '../../lib/format';
import { directionsLink } from '../../lib/geo';
import { useSeller } from '../../lib/seller';
import { sellerActions, STATUS_LABEL } from '../../lib/status';
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
