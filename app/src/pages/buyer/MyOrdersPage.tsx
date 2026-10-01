import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/OrderBits';
import { Empty, TopBar } from '../../components/ui';
import { formatDateTime, rupiah } from '../../lib/format';
import { useMyOrders } from '../../lib/local';
import { supabase } from '../../lib/supabase';
import type { OrderStatus } from '../../lib/types';

export default function MyOrdersPage() {
  const orders = useMyOrders();
  const [statuses, setStatuses] = useState<Record<string, OrderStatus>>({});

  useEffect(() => {
    if (!orders.length) return;
    // Status terbaru (hanya terlihat bila sesi pembeli yang sama, dijaga RLS)
    supabase.from('orders').select('id,status').in('id', orders.map(o => o.id)).then(({ data }) => {
      if (data) setStatuses(Object.fromEntries(data.map(r => [r.id, r.status as OrderStatus])));
    });
  }, [orders]);

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <TopBar title="Pesanan saya" back="/" />
      {orders.length === 0 ? (
        <Empty icon="🧾" title="Belum ada pesanan">Pesanan yang Anda buat di perangkat ini akan muncul di sini.</Empty>
      ) : (
        <ul className="space-y-3 p-4">
          {orders.map(o => (
            <li key={o.id}>
              <Link to={`/o/${o.id}?k=${o.track_token}`} className="card block p-4 active:bg-stone-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{o.store_name}</p>
                    <p className="text-xs text-stone-500">{o.code} • {formatDateTime(o.created_at)}</p>
                  </div>
                  {statuses[o.id] && <StatusBadge status={statuses[o.id]} />}
                </div>
                <p className="mt-2 text-sm font-bold tabular-nums">{rupiah(o.total)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
