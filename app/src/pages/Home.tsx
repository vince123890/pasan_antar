import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { InstallButton } from '../components/Install';
import { StoreAvatar } from '../components/ui';
import { useMyOrders, useRecentStores } from '../lib/local';

const SELLER_FEATURES = [
  ['🔔', 'Pesanan masuk berbunyi', 'Pesanan langsung muncul di HP Anda — tidak perlu ketik ulang dari chat.'],
  ['📍', 'Ongkir sesuai jarak', 'Atur sendiri: 0–5 km gratis, 5–10 km Rp1.000, dan seterusnya.'],
  ['📦', 'Kelola produk mudah', 'Foto boleh menyusul. Tandai "habis" cukup sekali ketuk.'],
  ['🔗', 'Link & QR toko', 'Bagikan ke grup WA atau tempel QR di etalase.'],
] as const;

const BUYER_FEATURES = [
  ['🙌', 'Tanpa daftar', 'Buka link toko, pilih barang, pesan. Selesai.'],
  ['💸', 'Ongkir jelas di awal', 'Tentukan lokasi di peta, total langsung terlihat.'],
  ['🛵', 'Lacak sampai tiba', 'Status pesanan berubah otomatis: diterima, diantar, selesai.'],
  ['💵', 'Bayar di tempat', 'Tunai saat barang tiba atau transfer ke penjual.'],
] as const;

const FAQ = [
  ['Apakah benar gratis?', 'Ya. Tidak ada komisi per pesanan dan tidak ada biaya bulanan untuk penjual maupun pembeli.'],
  ['Harus download dari Play Store?', 'Tidak. Aplikasi dipasang langsung dari browser (ukuran < 1 MB) dan otomatis selalu versi terbaru. Bisa juga dipakai tanpa dipasang.'],
  ['Bagaimana ongkir dihitung?', 'Dari jarak titik toko ke titik pembeli di peta, lalu dicocokkan dengan tarif yang diatur penjual. Total dihitung ulang di server agar selalu adil.'],
  ['Siapa yang mengantar?', 'Penjual sendiri (atau karyawannya), seperti layanan antar warung pada umumnya. Pembeli juga bisa memilih ambil sendiri.'],
  ['Pembayarannya bagaimana?', 'Tunai saat barang tiba (COD) atau transfer langsung ke rekening/e-wallet penjual. Uang tidak lewat kami.'],
  ['Cocok untuk usaha apa?', 'Warung kelontong, warung makan, kopi & minuman, angkringan, kue, sayur, toko material, dan usaha kecil lainnya.'],
] as const;

export default function Home() {
  const recent = useRecentStores();
  const orders = useMyOrders();

  return (
    <div className="min-h-dvh bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-stone-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <img src="/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-extrabold">Pesan Antar</span>
          <nav className="ml-6 hidden gap-5 text-sm text-stone-600 md:flex">
            <a href="#fitur" className="hover:text-stone-900">Fitur</a>
            <a href="#ongkir" className="hover:text-stone-900">Ongkir</a>
            <a href="#cara" className="hover:text-stone-900">Cara kerja</a>
            <a href="#faq" className="hover:text-stone-900">FAQ</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {orders.length > 0 && <Link to="/pesanan" className="btn-ghost hidden !px-3 sm:inline-flex">Pesanan saya</Link>}
            <Link to="/download" className="btn-primary !px-3 !py-2">Download</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pt-10 pb-14 md:grid-cols-2 md:pt-16 md:pb-20">
          <div>
            <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              0% komisi • Rp0 biaya bulanan
            </p>
            <h1 className="mt-4 text-4xl leading-[1.1] font-extrabold tracking-tight text-stone-900 md:text-5xl">
              Pesan antar dari <span className="text-brand-600">warung sebelah</span>.
            </h1>
            <p className="mt-4 text-lg text-stone-600">
              Penjual buka toko online dalam 5 menit. Pembeli pesan tanpa daftar.
              Ongkir dihitung otomatis dari jarak.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <InstallButton className="btn-primary py-3.5 text-base sm:px-6" label="Download aplikasi" />
              <Link to="/seller" className="btn-secondary py-3.5 text-base sm:px-6">🏪 Buka toko gratis</Link>
            </div>
            <p className="mt-3 text-xs text-stone-500">Android, iPhone & komputer • &lt;1 MB • tanpa Play Store</p>
          </div>
          <PhoneMock />
        </div>
      </section>

      {/* Untuk pembeli yang kembali */}
      {(recent.length > 0 || orders.length > 0) && (
        <section className="mx-auto max-w-5xl px-4 pb-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Lanjutkan belanja</h2>
              {orders.length > 0 && <Link to="/pesanan" className="text-sm font-semibold text-brand-700">Pesanan saya ({orders.length}) →</Link>}
            </div>
            {recent.length > 0 && (
              <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
                {recent.map(s => (
                  <Link key={s.slug} to={`/t/${s.slug}`} className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center">
                    <StoreAvatar name={s.name} url={s.logo_url} size="h-14 w-14" />
                    <span className="line-clamp-2 text-xs font-medium">{s.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="border-y border-stone-100 bg-stone-50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
          {[['0%', 'komisi per pesanan'], ['Rp0', 'biaya bulanan'], ['< 1 MB', 'ukuran aplikasi'], ['Realtime', 'pesanan & status']].map(([big, small]) => (
            <div key={small}>
              <p className="text-2xl font-extrabold text-stone-900">{big}</p>
              <p className="text-sm text-stone-500">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold">Satu aplikasi, dua sisi</h2>
        <p className="mt-2 text-center text-stone-600">Penjual dan pembeli memakai aplikasi yang sama.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <FeatureCard title="Untuk penjual" emoji="🏪" items={SELLER_FEATURES} cta={<Link to="/seller" className="btn-primary w-full">Buka toko gratis</Link>} />
          <FeatureCard title="Untuk pembeli" emoji="🛒" items={BUYER_FEATURES}
            cta={<p className="rounded-xl bg-stone-50 p-3 text-center text-sm text-stone-600">Minta link atau QR dari toko langganan Anda 🔗</p>} />
        </div>
      </section>

      {/* Ongkir */}
      <section id="ongkir" className="scroll-mt-16 bg-stone-900 text-white">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-brand-200">Ongkir otomatis</p>
            <h2 className="mt-2 text-3xl font-extrabold">Penjual yang atur, sistem yang hitung.</h2>
            <p className="mt-3 text-stone-300">
              Penjual menentukan tarif per jarak. Pembeli menandai lokasinya di peta, ongkir langsung tampil
              sebelum pesan. Di luar jangkauan? Pembeli bisa pilih ambil sendiri.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-stone-300">
              <li>✓ Gratis, per order, atau per km</li>
              <li>✓ Gratis ongkir bila belanja minimal tertentu</li>
              <li>✓ Batas jangkauan antar otomatis</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-white p-5 text-stone-900 shadow-2xl">
            <p className="text-sm font-semibold text-stone-500">Contoh tarif Warung Bu Sri</p>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {[['0 – 5 km', 'Gratis', 'text-emerald-700'], ['5 – 10 km', 'Rp1.000 / order', ''], ['10 – 15 km', 'Rp2.000 / km', ''], ['> 15 km', 'Di luar jangkauan', 'text-stone-400']].map(([r, f, c]) => (
                  <tr key={r} className="border-b border-stone-100 last:border-0">
                    <td className="py-3 text-stone-600">{r}</td>
                    <td className={`py-3 text-right font-semibold ${c}`}>{f}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Jarak ±3,9 km → ongkir GRATIS</p>
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara" className="mx-auto max-w-5xl scroll-mt-16 px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold">Cara kerjanya</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            ['1', 'Penjual buka toko', 'Login, isi nama toko, tandai lokasi, tambah produk.'],
            ['2', 'Bagikan link / QR', 'Kirim ke grup WA RT, status, atau tempel di warung.'],
            ['3', 'Pembeli pesan', 'Pilih barang, tandai lokasi, ongkir langsung terlihat.'],
            ['4', 'Antar & selesai', 'Pesanan berbunyi di HP penjual, status terpantau pembeli.'],
          ].map(([n, t, d]) => (
            <li key={n} className="card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{n}</span>
              <p className="mt-3 font-bold">{t}</p>
              <p className="mt-1 text-sm text-stone-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-16 bg-stone-50">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center text-3xl font-extrabold">Pertanyaan umum</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="card group p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span className="text-stone-400 transition group-open:rotate-45">＋</span>
                </summary>
                <p className="mt-2 text-sm text-stone-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA akhir */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-3xl bg-brand-600 px-6 py-12 text-center text-white">
          <h2 className="text-3xl font-extrabold">Mulai terima pesanan antar hari ini.</h2>
          <p className="mt-2 text-brand-100">Gratis, tanpa komisi, siap dalam 5 menit.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <InstallButton className="btn bg-white py-3.5 text-base text-brand-700 hover:bg-brand-50 sm:px-6" label="Download aplikasi" />
            <Link to="/seller" className="btn border border-white/40 py-3.5 text-base text-white hover:bg-white/10 sm:px-6">Buka toko gratis</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-100">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-stone-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="" className="h-6 w-6 rounded-md" />
            <span>Pesan Antar © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <Link to="/download" className="hover:text-stone-800">Download</Link>
            <Link to="/seller" className="hover:text-stone-800">Penjual</Link>
            <Link to="/pesanan" className="hover:text-stone-800">Pesanan saya</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, emoji, items, cta }: {
  title: string; emoji: string; items: readonly (readonly [string, string, string])[]; cta: ReactNode;
}) {
  return (
    <div className="card flex flex-col p-6">
      <p className="text-3xl">{emoji}</p>
      <h3 className="mt-2 text-xl font-extrabold">{title}</h3>
      <ul className="mt-5 flex-1 space-y-4">
        {items.map(([icon, t, d]) => (
          <li key={t} className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-lg">{icon}</span>
            <div>
              <p className="font-semibold">{t}</p>
              <p className="text-sm text-stone-600">{d}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
    </div>
  );
}

/** Ilustrasi HP: notifikasi pesanan di sisi penjual. */
function PhoneMock() {
  return (
    <div className="relative mx-auto w-64 md:w-72" aria-hidden>
      <div className="rounded-[2.5rem] border-[10px] border-stone-900 bg-stone-50 shadow-2xl">
        <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-stone-900" />
        <div className="space-y-3 p-3 pb-6">
          <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs shadow-sm">
            <span className="font-bold">Warung Bu Sri</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">Buka</span>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-white p-3 shadow-sm ring-1 ring-amber-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Dimas</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Baru</span>
            </div>
            <p className="text-[11px] text-stone-500">PA-7F3K2Q • baru saja</p>
            <p className="mt-2 text-xs text-stone-700">2× Indomie Goreng, 1× Telur, 1× Es Teh</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-stone-600">🛵 ±3,9 km • Gratis ongkir</span>
              <span className="font-bold">Rp27.000</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <span className="col-span-2 rounded-lg bg-brand-600 py-1.5 text-center text-xs font-semibold text-white">Terima</span>
              <span className="rounded-lg border border-red-200 py-1.5 text-center text-xs font-semibold text-red-700">Tolak</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-3 opacity-70 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Rina</p>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">Diantar</span>
            </div>
            <p className="mt-1 text-xs text-stone-600">1× Gas 3 kg, 1× Galon</p>
          </div>
        </div>
      </div>
      <div className="absolute -top-3 -right-4 rounded-2xl bg-white px-3 py-2 text-xs font-semibold shadow-lg ring-1 ring-stone-100">
        🔔 Pesanan baru!
      </div>
    </div>
  );
}
