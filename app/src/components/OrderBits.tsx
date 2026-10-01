import { rupiah } from '../lib/format';
import { STATUS_LABEL, STATUS_TONE, timeline } from '../lib/status';
import type { Order, OrderItem } from '../lib/types';

export function StatusBadge({ status }: { status: Order['status'] }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y divide-stone-100">
      {items.map(i => (
        <li key={i.id} className="flex gap-3 py-2.5 text-sm">
          <span className="w-8 shrink-0 font-semibold text-brand-700">{i.qty}×</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{i.name}</p>
            {i.note && <p className="text-xs text-stone-500">Catatan: {i.note}</p>}
          </div>
          <span className="shrink-0 tabular-nums">{rupiah(i.line_total)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Totals({ order }: { order: Pick<Order, 'subtotal' | 'delivery_fee' | 'total' | 'fulfillment' | 'distance_km'> }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between"><dt className="text-stone-600">Subtotal</dt><dd className="tabular-nums">{rupiah(order.subtotal)}</dd></div>
      <div className="flex justify-between">
        <dt className="text-stone-600">
          {order.fulfillment === 'delivery' ? `Ongkir${order.distance_km != null ? ` (±${order.distance_km} km)` : ''}` : 'Ambil sendiri'}
        </dt>
        <dd className="tabular-nums">{order.delivery_fee ? rupiah(order.delivery_fee) : 'Gratis'}</dd>
      </div>
      <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold">
        <dt>Total</dt><dd className="tabular-nums">{rupiah(order.total)}</dd>
      </div>
    </dl>
  );
}

export function Timeline({ order }: { order: Pick<Order, 'status' | 'fulfillment'> }) {
  if (order.status === 'rejected' || order.status === 'cancelled') return null;
  const steps = timeline(order.fulfillment);
  const idx = steps.indexOf(order.status);
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => {
        const done = i <= idx;
        return (
          <li key={s} className="flex items-center gap-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              done ? 'bg-brand-600 text-white' : 'bg-stone-200 text-stone-500'} ${i === idx ? 'ring-4 ring-brand-100' : ''}`}>
              {done ? '✓' : i + 1}
            </span>
            <span className={`text-sm ${i === idx ? 'font-bold text-stone-900' : done ? 'text-stone-700' : 'text-stone-400'}`}>
              {STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
