import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { InstallButton } from '../components/Install';
import { CountUp, Reveal, WordRise } from '../components/landing/motion';
import OngkirSimulator from '../components/landing/OngkirSimulator';
import Story from '../components/landing/Story';
import { StoreAvatar } from '../components/ui';
import { useMyOrders, useRecentStores } from '../lib/local';

const HeroPlayer = lazy(() => import('../components/landing/HeroPlayer'));
const TutorialPlayer = lazy(() => import('../components/landing/TutorialPlayer'));

const CATEGORIES: [IconName, string][] = [
  ['store', 'Warung kelontong'], ['bowl', 'Warung makan'], ['coffee', 'Kopi & minuman'], ['sparkle', 'Angkringan'],
  ['cake', 'Kue & jajanan'], ['leaf', 'Sayur & buah'], ['brick', 'Toko material'], ['cross', 'Kebutuhan bayi & kesehatan'],
];

const SELLER: [IconName, string, string][] = [
  ['bell', 'Pesanan masuk berbunyi', 'Langsung muncul di HP — tidak perlu salin ulang dari chat.'],
  ['map', 'Ongkir sesuai jarak', 'Atur sendiri: gratis, per order, atau per km. Batas jangkauan otomatis.'],
  ['box', 'Produk mudah dikelola', 'Foto boleh menyusul. Tandai "habis" cukup sekali ketuk.'],
  ['link', 'Link & QR toko', 'Bagikan ke grup WA atau tempel QR di etalase.'],
];

const BUYER: [IconName, string, string][] = [
  ['user', 'Tanpa daftar', 'Buka link toko, pilih barang, pesan. Selesai.'],
  ['pin', 'Ongkir jelas di awal', 'Tandai rumah di peta, total langsung terlihat sebelum pesan.'],
  ['scooter', 'Lacak sampai tiba', 'Status berubah otomatis: diterima, diantar, selesai.'],
  ['wallet', 'Bayar di tempat', 'Tunai saat barang tiba atau transfer langsung ke penjual.'],
];

const FAQ: [string, string][] = [
  ['Apakah benar gratis?', 'Ya. Tidak ada komisi per pesanan dan tidak ada biaya bulanan, untuk penjual maupun pembeli.'],
  ['Bagaimana cara memasang aplikasinya?', 'Ketuk tombol "Download aplikasi" — aplikasi terpasang di layar utama HP (di bawah 1 MB) dan otomatis selalu versi terbaru. Bisa juga langsung dipakai dari browser tanpa dipasang.'],
  ['Bagaimana ongkir dihitung?', 'Dari jarak titik toko ke titik pembeli di peta, lalu dicocokkan dengan tarif yang diatur penjual. Total dihitung ulang di server agar selalu adil.'],
  ['Siapa yang mengantar?', 'Penjual sendiri atau karyawannya, seperti layanan antar warung pada umumnya. Pembeli juga bisa memilih ambil sendiri.'],
  ['Pembayarannya bagaimana?', 'Tunai saat barang tiba (COD) atau transfer langsung ke rekening/e-wallet penjual. Uang tidak lewat kami.'],
  ['Cocok untuk usaha apa?', 'Warung kelontong, warung makan, kopi & minuman, angkringan, kue, sayur, toko material, dan usaha kecil lainnya.'],
];

export default function Home() {
  const recent = useRecentStores();
  const orders = useMyOrders();

  // Landing dimuat lazy, jadi lompat ke #anchor dilakukan setelah render
  useEffect(() => {
    if (!window.location.hash) return;
    const t = setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView(), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="grain relative min-h-dvh overflow-x-clip bg-white">
      <Nav hasOrders={orders.length > 0} />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-[#fbf6f0]">
        <div className="blob-a pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-brand-200/50 blur-3xl" />
        <div className="blob-b pointer-events-none absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-teal-200/40 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pt-10 pb-8 md:grid-cols-[1.05fr_1fr] md:gap-10 md:pt-14 md:pb-14">
          <div className="text-center md:text-left">
            <p className="word-rise inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-stone-700 shadow-sm ring-1 ring-stone-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Dari warung, untuk tetangga
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-extrabold tracking-[-0.035em] text-stone-900 sm:text-5xl lg:text-6xl">
              <WordRise text="Pesan antar dari" startDelay={120} />
              <span className="relative inline-block text-brand-600">
                <WordRise text="warung sebelah." startDelay={330} />
                <svg className="underline-draw absolute -bottom-2 left-0 w-full" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden>
                  <path d="M3 10 C 80 2, 200 2, 297 8" fill="none" stroke="#e8590c" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
                </svg>
              </span>
            </h1>
            <p className="word-rise mx-auto mt-5 max-w-lg text-lg text-stone-600 md:mx-0" style={{ animationDelay: '520ms' }}>
              Penjual buka toko online dalam 5 menit. Pembeli pesan tanpa daftar. Ongkir dihitung otomatis dari jarak —
              <b className="text-stone-800"> tanpa komisi.</b>
            </p>
            <div className="word-rise mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start" style={{ animationDelay: '640ms' }}>
              <InstallButton className="btn-primary glow-breathe py-3.5 text-base sm:px-6" label="Download aplikasi" />
              <Link to="/seller" className="btn-secondary py-3.5 text-base sm:px-6">
                <Icon name="store" className="h-5 w-5" /> Buka toko gratis
              </Link>
            </div>
            <div className="word-rise mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-stone-500 md:justify-start" style={{ animationDelay: '760ms' }}>
              {['0% komisi', 'Rp0 / bulan', '< 1 MB', 'Langsung dari browser'].map(t => (
                <span key={t} className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-emerald-600" strokeWidth={2.6} />{t}</span>
              ))}
            </div>
          </div>

          <div className="word-rise mx-auto w-full max-w-[460px]" style={{ animationDelay: '200ms' }}>
            <div className="overflow-hidden rounded-[2rem] ring-1 ring-stone-200/70 shadow-[0_40px_80px_-30px_rgba(28,25,23,0.35)]">
              <Suspense fallback={<div className="aspect-[720/900] w-full animate-pulse bg-[#f3eae0]" />}>
                <HeroPlayer />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Marquee kategori */}
        <div className="relative border-y border-stone-200/70 bg-white/70 py-4 backdrop-blur">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
          <div className="overflow-hidden">
            <div className="marquee-track flex w-max gap-3">
              {[...CATEGORIES, ...CATEGORIES].map(([ic, label], i) => (
                <span key={i} className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700">
                  <Icon name={ic} className="h-4 w-4 text-brand-600" /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pembeli yang kembali */}
      {(recent.length > 0 || orders.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-8">
          <Reveal className="card p-4">
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
          </Reveal>
        </section>
      )}

      {/* ---------------- Cerita brand ---------------- */}
      <Story />

      {/* ---------------- Angka ---------------- */}
      <section className="bg-stone-900 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-14 text-center md:grid-cols-4">
          {([
            [<CountUp key="a" to={0} suffix="%" />, 'komisi per pesanan'],
            [<CountUp key="b" to={0} prefix="Rp" />, 'biaya bulanan'],
            [<><span className="text-stone-400">&lt;</span><CountUp key="c" to={1} suffix=" MB" /></>, 'ukuran aplikasi'],
            [<CountUp key="d" to={3} suffix=" langkah" />, 'dari pilih sampai pesan'],
          ] as [ReactNode, string][]).map(([big, small], i) => (
            <Reveal key={small} delay={i * 90}>
              <p className="text-4xl font-extrabold tracking-tight md:text-5xl">{big}</p>
              <p className="mt-1 text-sm text-stone-400">{small}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Fitur ---------------- */}
      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-brand-700 uppercase">Satu aplikasi, dua sisi</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Mudah untuk penjual. Mudah untuk pembeli.</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <FeatureCard title="Untuk penjual" icon="store" items={SELLER} dark
            cta={<Link to="/seller" className="btn bg-white py-3 text-stone-900 hover:bg-stone-100">Buka toko gratis <Icon name="arrow" className="h-4 w-4" /></Link>} />
          <FeatureCard title="Untuk pembeli" icon="cart" items={BUYER} delay={120}
            cta={<p className="rounded-xl bg-stone-50 p-3 text-center text-sm text-stone-600">Minta link atau QR dari toko langganan Anda</p>} />
        </div>
      </section>

      {/* ---------------- Ongkir ---------------- */}
      <section id="ongkir" className="relative scroll-mt-16 overflow-hidden bg-stone-950 text-white">
        <div className="blob-a pointer-events-none absolute -top-40 right-0 h-[480px] w-[480px] rounded-full bg-brand-600/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2">
          <div>
            <Reveal><p className="text-sm font-bold tracking-wide text-brand-200 uppercase">Ongkir otomatis</p></Reveal>
            <Reveal delay={80}><h2 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight">Penjual yang atur.<br />Sistem yang hitung.</h2></Reveal>
            <Reveal delay={160}>
              <p className="mt-4 text-lg text-stone-300">
                Tidak ada lagi "ongkirnya berapa, Bu?". Pembeli menandai rumahnya di peta, ongkir langsung tampil sebelum pesan.
                Di luar jangkauan? Pembeli bisa ambil sendiri.
              </p>
            </Reveal>
            <ul className="mt-6 space-y-3 text-stone-200">
              {['Gratis, per order, atau per km', 'Gratis ongkir untuk belanja minimal tertentu', 'Batas jangkauan antar otomatis'].map((t, i) => (
                <Reveal key={t} as="li" delay={240 + i * 80} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600"><Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /></span>{t}
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal delay={120}><OngkirSimulator /></Reveal>
        </div>
      </section>

      {/* ---------------- Cara pakai (video panduan) ---------------- */}
      <section id="cara" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-brand-700 uppercase">Cara pakai</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Lihat langsung, siap dalam 5 menit.</h2>
          <p className="mt-3 text-lg text-stone-600">Pilih panduan penjual atau pembeli. Ketuk langkah mana pun untuk melompat.</p>
        </Reveal>
        <Reveal delay={120} className="mt-12">
          <Suspense fallback={<div className="mx-auto aspect-[720/900] w-full max-w-[460px] animate-pulse rounded-[2rem] bg-[#f3eae0]" />}>
            <TutorialPlayer />
          </Suspense>
        </Reveal>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="scroll-mt-16 bg-[#fbf6f0]">
        <div className="mx-auto max-w-3xl px-4 py-20">
          <Reveal className="text-center"><h2 className="text-4xl font-extrabold tracking-tight">Pertanyaan umum</h2></Reveal>
          <div className="mt-10 space-y-3">
            {FAQ.map(([q, a], i) => <FaqItem key={q} q={q} a={a} delay={i * 60} />)}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-brand-600 px-6 py-14 text-center text-white md:py-20">
          <div className="blob-b pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
          <div className="blob-a pointer-events-none absolute -right-20 -bottom-28 h-80 w-80 rounded-full bg-black/15 blur-2xl" />
          <p className="relative text-sm font-bold tracking-wide text-brand-100 uppercase">Dari warung, untuk tetangga</p>
          <h2 className="relative mx-auto mt-3 max-w-2xl text-4xl leading-tight font-extrabold tracking-tight md:text-5xl">
            Mulai terima pesanan antar hari ini.
          </h2>
          <p className="relative mt-3 text-brand-100">Gratis, tanpa komisi, siap dalam 5 menit.</p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <InstallButton className="btn bg-white py-3.5 text-base text-brand-700 shadow-lg hover:bg-brand-50 sm:px-6" label="Download aplikasi" />
            <Link to="/seller" className="btn border border-white/40 py-3.5 text-base text-white hover:bg-white/10 sm:px-6">Buka toko gratis</Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-stone-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-stone-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="" className="h-7 w-7 rounded-lg" />
            <span><b className="text-stone-800">Pesan Antar</b> — dari warung, untuk tetangga.</span>
          </div>
          <div className="flex gap-5">
            <Link to="/download" className="hover:text-stone-800">Download</Link>
            <Link to="/seller" className="hover:text-stone-800">Penjual</Link>
            <Link to="/pesanan" className="hover:text-stone-800">Pesanan saya</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Nav({ hasOrders }: { hasOrders: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <img src="/icon-192.png" alt="" className="h-9 w-9 rounded-xl" />
        <span className="text-lg font-extrabold tracking-tight">Pesan Antar</span>
        <nav className="ml-8 hidden gap-6 text-sm font-medium text-stone-600 lg:flex">
          {[['#cerita', 'Cerita'], ['#fitur', 'Fitur'], ['#ongkir', 'Ongkir'], ['#cara', 'Cara pakai'], ['#faq', 'FAQ']].map(([h, l]) => (
            <a key={h} href={h} className="transition-colors hover:text-stone-900">{l}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {hasOrders && <Link to="/pesanan" className="btn-ghost hidden !px-3 sm:inline-flex">Pesanan saya</Link>}
          <Link to="/seller" className="btn-ghost hidden !px-3 sm:inline-flex">Masuk penjual</Link>
          <Link to="/download" className="btn-primary !px-4 !py-2"><Icon name="download" className="h-4 w-4" /> Download</Link>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({ title, icon, items, cta, dark = false, delay = 0 }: {
  title: string; icon: IconName; items: [IconName, string, string][]; cta: ReactNode; dark?: boolean; delay?: number;
}) {
  return (
    <Reveal delay={delay} className={`flex flex-col rounded-[1.75rem] p-7 ${dark ? 'bg-stone-900 text-white' : 'border border-stone-200 bg-white'}`}>
      <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${dark ? 'bg-white/10 text-brand-200' : 'bg-brand-50 text-brand-700'}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-2xl font-extrabold tracking-tight">{title}</h3>
      <ul className="mt-6 flex-1 space-y-5">
        {items.map(([ic, t, d], i) => (
          <Reveal key={t} as="li" delay={delay + 100 + i * 80} className="flex gap-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-white/10 text-white' : 'bg-stone-100 text-stone-700'}`}>
              <Icon name={ic} className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">{t}</p>
              <p className={`text-sm ${dark ? 'text-stone-400' : 'text-stone-600'}`}>{d}</p>
            </div>
          </Reveal>
        ))}
      </ul>
      <div className="mt-7">{cta}</div>
    </Reveal>
  );
}

function FaqItem({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay} className="card overflow-hidden">
      <button className="flex w-full items-center justify-between gap-4 p-5 text-left font-bold" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {q}
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 transition-transform duration-500 ${open ? 'rotate-45' : ''}`}
          style={{ transitionTimingFunction: 'var(--ease-out)' }}>
          <Icon name="plus" className="h-4 w-4" />
        </span>
      </button>
      <div className="grid transition-[grid-template-rows] duration-500" style={{ gridTemplateRows: open ? '1fr' : '0fr', transitionTimingFunction: 'var(--ease-out)' }}>
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-stone-600">{a}</p>
        </div>
      </div>
    </Reveal>
  );
}
