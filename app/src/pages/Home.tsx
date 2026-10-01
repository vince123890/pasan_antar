import { Link } from 'react-router-dom';
import { StoreAvatar } from '../components/ui';
import { useMyOrders, useRecentStores } from '../lib/local';

export default function Home() {
  const recent = useRecentStores();
  const orders = useMyOrders();

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <section className="bg-brand-600 px-6 pt-12 pb-10 text-white">
        <p className="text-4xl">🛵</p>
        <h1 className="mt-3 text-3xl leading-tight font-extrabold">Pesan antar dari warung sebelah.</h1>
        <p className="mt-2 text-brand-100">Tanpa daftar. Ongkir dihitung otomatis dari jarak. Bayar di tempat.</p>
      </section>

      <div className="-mt-6 space-y-4 px-4 pb-10">
        <Link to="/seller" className="card flex items-center gap-4 p-4 shadow-sm transition active:bg-stone-50">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl">🏪</span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Saya penjual</span>
            <span className="block text-sm text-stone-600">Buka toko online gratis & terima pesanan antar</span>
          </span>
          <span className="text-stone-400">→</span>
        </Link>

        {orders.length > 0 && (
          <Link to="/pesanan" className="card flex items-center gap-4 p-4 transition active:bg-stone-50">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-2xl">🧾</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Pesanan saya</span>
              <span className="block text-sm text-stone-600">{orders.length} pesanan di perangkat ini</span>
            </span>
            <span className="text-stone-400">→</span>
          </Link>
        )}

        {recent.length > 0 && (
          <section>
            <h2 className="mt-6 mb-2 px-1 text-sm font-semibold text-stone-500">Toko yang pernah dibuka</h2>
            <ul className="card divide-y divide-stone-100">
              {recent.map(s => (
                <li key={s.slug}>
                  <Link to={`/t/${s.slug}`} className="flex items-center gap-3 p-3 active:bg-stone-50">
                    <StoreAvatar name={s.name} url={s.logo_url} size="h-10 w-10" />
                    <span className="flex-1 font-medium">{s.name}</span>
                    <span className="text-stone-400">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="pt-4">
          <h2 className="mb-3 px-1 text-sm font-semibold text-stone-500">Cara pesan</h2>
          <ol className="space-y-3 text-sm">
            {[
              ['🔗', 'Buka link atau scan QR dari toko langganan Anda'],
              ['🛒', 'Pilih barang, tentukan lokasi — ongkir langsung terlihat'],
              ['📲', 'Pesanan masuk ke toko, pantau statusnya sampai tiba'],
            ].map(([icon, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">{icon}</span>
                <span className="text-stone-700">{text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
