import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { OfflineBanner, PageLoading, Toggle, toast, useOnline } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { rupiah } from '../../lib/format';
import { getPref, setPref } from '../../lib/local';
import { audioReady, notify, playNewOrderSound, unlockAudio } from '../../lib/media';
import { fetchOrder, fetchSellerOrders, SellerContext, type SellerContextValue } from '../../lib/seller';
import { isAnonymous, supabase, useSession } from '../../lib/supabase';
import type { Order, OrderStatus, Store } from '../../lib/types';
import Onboarding from './Onboarding';

const NAV = [
  { to: '/seller', label: 'Pesanan', icon: 'M4 6h16M4 12h16M4 18h10', end: true },
  { to: '/seller/produk', label: 'Produk', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/seller/ongkir', label: 'Ongkir', icon: 'M12 21s-7-6.5-7-12a7 7 0 1114 0c0 5.5-7 12-7 12zm0-9a3 3 0 100-6 3 3 0 000 6z' },
  { to: '/seller/bagikan', label: 'Bagikan', icon: 'M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14' },
  { to: '/seller/toko', label: 'Toko', icon: 'M3 9l1-5h16l1 5M3 9h18M3 9v11h18V9M9 20v-6h6v6' },
];

export default function SellerLayout() {
  const session = useSession();
  const [store, setStoreState] = useState<Store | null | undefined>(undefined);
  const userId = session?.user.id;

  const setStore = useCallback((s: Store) => {
    setStoreState(s);
    setPref('seller_store', s);
  }, []);

  useEffect(() => {
    if (!userId || isAnonymous(session ?? null)) return;
    let cancelled = false;
    supabase
      .from('stores')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at')
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          const cached = getPref<Store | null>('seller_store', null);
          if (cached && cached.owner_id === userId) setStoreState(cached);
          else toast(toAppError(error).message, 'error');
          return;
        }
        if (data) setStore(data as Store);
        else setStoreState(null);
      });
    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (session === undefined) return <PageLoading />;
  if (!session || isAnonymous(session)) return <Navigate to="/seller/login" replace />;
  if (store === undefined) return <PageLoading />;
  if (store === null) return <Onboarding onCreated={setStore} />;
  return <SellerShell session={session} store={store} setStore={setStore} />;
}

function SellerShell({ session, store, setStore }: Pick<SellerContextValue, 'session' | 'store' | 'setStore'>) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(audioReady());
  const online = useOnline();

  const refreshOrders = useCallback(async () => {
    try {
      setOrders(await fetchSellerOrders(store.id));
    } catch (e) {
      if (navigator.onLine) toast(toAppError(e).message, 'error');
    } finally {
      setOrdersLoading(false);
    }
  }, [store.id]);

  // Realtime pesanan + cadangan polling 60 dtk
  useEffect(() => {
    const ch = supabase
      .channel(`store-orders-${store.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${store.id}` },
        async payload => {
          const row = payload.new as Order;
          const full = (await fetchOrder(row.id).catch(() => null)) ?? row;
          setOrders(prev => [full, ...prev.filter(o => o.id !== full.id)]);
          playNewOrderSound();
          notify(`Pesanan baru ${full.code}`, `${full.buyer_name} • ${rupiah(full.total)}`);
          toast(`🔔 Pesanan baru dari ${full.buyer_name}`, 'success');
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `store_id=eq.${store.id}` },
        payload => {
          const row = payload.new as Order;
          setOrders(prev => prev.map(o => (o.id === row.id ? { ...o, ...row, order_items: o.order_items } : o)));
        })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') refreshOrders(); // isi celah setelah koneksi tersambung ulang
      });
    const timer = setInterval(() => document.visibilityState === 'visible' && refreshOrders(), 60_000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(ch);
    };
  }, [store.id, refreshOrders]);

  const pendingCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);
  useEffect(() => {
    document.title = pendingCount ? `(${pendingCount}) Pesanan baru • ${store.name}` : store.name;
  }, [pendingCount, store.name]);

  const changeStatus = useCallback(async (order: Order, to: OrderStatus, reason?: string) => {
    const { data, error } = await supabase.rpc('update_order_status', {
      p_order_id: order.id, p_from: order.status, p_to: to, p_reason: reason ?? null,
    });
    if (error) {
      const e = toAppError(error);
      if (e.code === 'STATUS_CONFLICT') await refreshOrders();
      throw e;
    }
    const row = data as Order;
    setOrders(prev => prev.map(o => (o.id === row.id ? { ...o, ...row, order_items: o.order_items } : o)));
  }, [refreshOrders]);

  const updateStore = useCallback(async (patch: Partial<Store>) => {
    const { data, error } = await supabase.from('stores').update(patch).eq('id', store.id).select().single();
    if (error) throw toAppError(error);
    setStore(data as Store);
  }, [store.id, setStore]);

  const enableSound = async () => {
    const ok = await unlockAudio();
    setSoundOn(ok);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    if (ok) {
      playNewOrderSound();
      toast('Suara pesanan aktif');
    }
  };

  const ctx: SellerContextValue = { session, store, setStore, orders, ordersLoading, refreshOrders, changeStatus, updateStore };

  return (
    <SellerContext.Provider value={ctx}>
      <div className="mx-auto min-h-dvh max-w-lg bg-stone-50 pb-24">
        <OfflineBanner />
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{store.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-stone-400'}`} />
              {online ? 'Online' : 'Offline'}
            </p>
          </div>
          <Toggle
            label={<span className={`text-sm font-semibold ${store.is_open ? 'text-emerald-700' : 'text-stone-500'}`}>{store.is_open ? 'Buka' : 'Tutup'}</span>}
            checked={store.is_open}
            disabled={!online}
            onChange={v => updateStore({ is_open: v }).then(
              () => toast(v ? 'Toko dibuka' : 'Toko ditutup'),
              e => toast(e.message, 'error'),
            )}
          />
        </header>

        {!soundOn && (
          <button onClick={enableSound} className="flex w-full items-center gap-3 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
            <span className="text-xl">🔔</span>
            <span className="flex-1"><b>Ketuk di sini</b> untuk mengaktifkan bunyi saat ada pesanan baru.</span>
          </button>
        )}

        <Outlet />

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-brand-600' : 'text-stone-500'}`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon} />
              </svg>
              {n.label}
              {n.to === '/seller' && pendingCount > 0 && (
                <span className="absolute top-1 left-1/2 ml-2 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-[10px] leading-5 font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </SellerContext.Provider>
  );
}
