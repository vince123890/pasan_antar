import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/OrderBits';
import { Empty, PageLoading } from '../../components/ui';
import { rupiah, timeAgo } from '../../lib/format';
import { useSeller } from '../../lib/seller';
import { ACTIVE, FINAL, PAYMENT_LABEL, PAYMENT_TONE } from '../../lib/status';
import type { Order } from '../../lib/types';

type Tab = 'baru' | 'proses' | 'riwayat';

export default function Orders() {
  const { orders, ordersLoading, store } = useSeller();
  const [tab, setTab] = useState<Tab>('baru');
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const groups = useMemo(() => ({
    baru: orders.filter(o => o.status === 'pending'),
    proses: orders.filter(o => ACTIVE.includes(o.status)),
    riwayat: orders.filter(o => FINAL.includes(o.status)),
  }), [orders]);

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const done = orders.filter(o => o.status === 'completed' && new Date(o.created_at) >= start);
    return { count: done.length, total: done.reduce((s, o) => s + o.total, 0) };
  }, [orders]);

  if (ordersLoading) return <PageLoading />;
  const list = groups[tab];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        <div className="card p-3">
          <p className="text-xs text-stone-500">Selesai hari ini</p>
          <p className="text-xl font-bold">{today.count}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-stone-500">Omzet hari ini</p>
          <p className="text-xl font-bold tabular-nums">{rupiah(today.total)}</p>
        </div>
      </div>

      <div className="flex gap-2 px-4 pt-4">
        {([['baru', 'Baru'], ['proses', 'Diproses'], ['riwayat', 'Riwayat']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`chip ${tab === k ? 'chip-active' : ''}`}>
            {label} {groups[k].length > 0 && <span className="ml-1 opacity-80">{groups[k].length}</span>}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        tab === 'baru' ? (
          <Empty icon="🛎️" title="Belum ada pesanan baru">
            {store.is_open ? 'Pesanan akan muncul di sini dengan bunyi notifikasi.' : 'Toko sedang tutup. Aktifkan "Buka" di atas.'}
            <div className="mt-4"><Link to="/seller/bagikan" className="btn-primary">Bagikan link toko</Link></div>
          </Empty>
        ) : (
          <Empty title={tab === 'proses' ? 'Tidak ada pesanan yang diproses' : 'Belum ada riwayat 14 hari terakhir'} />
        )
      ) : (
        <ul className="space-y-3 p-4">
          {list.map(o => <OrderCard key={o.id} order={o} now={now} />)}
        </ul>
      )}
    </div>
  );
}

function OrderCard({ order: o, now }: { order: Order; now: number }) {
  const late = o.status === 'pending' && now - new Date(o.created_at).getTime() > 10 * 60_000;
  const items = o.order_items ?? [];
  return (
    <li>
      <Link to={`/seller/pesanan/${o.id}`} className={`card block p-4 transition active:bg-stone-50 ${o.status === 'pending' ? 'border-amber-300 ring-1 ring-amber-200' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{o.buyer_name}</p>
            <p className="text-xs text-stone-500">
              {o.code} • {timeAgo(o.created_at, now)}
              {late && <span className="ml-1 font-semibold text-red-600">• belum direspon</span>}
            </p>
          </div>
          <StatusBadge status={o.status} />
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-stone-700">
          {items.map(i => `${i.qty}× ${i.name}`).join(', ')}
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-stone-600">
            {o.fulfillment === 'delivery' ? `🛵 Antar ±${o.distance_km ?? '-'} km` : '🏪 Ambil sendiri'} • {o.payment_method === 'cod' ? 'COD' : 'Transfer'}
            {o.status !== 'cancelled' && o.status !== 'rejected' && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${PAYMENT_TONE[o.payment_status]}`}>{PAYMENT_LABEL[o.payment_status]}</span>
            )}
          </span>
          <span className="font-bold tabular-nums">{rupiah(o.total)}</span>
        </div>
      </Link>
    </li>
  );
}
