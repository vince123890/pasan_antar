import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { InstallButton } from '../components/Install';
import { Reveal, WordRise } from '../components/landing/motion';
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
  ['receipt', 'Lunas tercatat, nota terkirim', 'Tandai COD/transfer lunas, nota rapi langsung terkirim ke WhatsApp pembeli.'],
];

const BUYER: [IconName, string, string][] = [
  ['user', 'Tanpa daftar', 'Buka link toko, pilih barang, pesan. Selesai.'],
  ['pin', 'Ongkir jelas di awal', 'Tandai rumah di peta, total langsung terlihat sebelum pesan.'],
  ['scooter', 'Lacak sampai tiba', 'Status berubah otomatis: diterima, diantar, selesai.'],
  ['wallet', 'Bayar tunai atau transfer', 'Foto bukti transfer langsung dari kamera, kirim ke WhatsApp penjual, terima nota lunas.'],
];

const PLAN: [IconName, string, string][] = [
  ['store', 'Buat toko', 'Isi nama toko, tandai lokasi, tambah produk. Sekitar 5 menit.'],
  ['link', 'Bagikan link / QR', 'Kirim ke grup WA RT, pasang di status, atau tempel QR di etalase.'],
  ['scooter', 'Terima & antar', 'Pesanan berbunyi di HP Anda. Terima, siapkan, antar.'],
];

const BEFORE_AFTER: [string, string, string][] = [
  ['Pesanan', 'Chat terpotong-potong, disalin ulang ke kertas', 'Masuk rapi ke HP Anda dengan bunyi'],
  ['Ongkir', 'Dihitung kira-kira, sering tekor', 'Terhitung otomatis dari jarak, sesuai tarif Anda'],
  ['Alamat', '"Yang kemarin, Bu"', 'Titik di peta + patokan rumah'],
  ['Pembayaran', 'Bukti transfer tercecer di chat, nota tulis tangan', 'Status lunas tercatat, nota rapi terkirim ke WhatsApp'],
  ['Untung', 'Dipotong komisi aplikasi', 'Utuh, dibayar langsung ke Anda'],
];

const FAQ: [string, string][] = [
  ['Apakah benar gratis?', 'Ya. Tidak ada komisi per pesanan dan tidak ada biaya bulanan. Pembeli juga tidak dipungut biaya apa pun.'],
  ['Bagaimana cara memasang aplikasinya?', 'Ketuk tombol "Download aplikasi" — aplikasi terpasang di layar utama HP (di bawah 1 MB) dan otomatis selalu versi terbaru. Bisa juga langsung dipakai dari browser tanpa dipasang.'],
  ['Bagaimana ongkir dihitung?', 'Dari jarak titik toko ke titik pembeli di peta, lalu dicocokkan dengan tarif yang diatur penjual. Total dihitung ulang di server agar selalu adil.'],
  ['Siapa yang mengantar?', 'Penjual sendiri atau karyawannya, seperti layanan antar warung pada umumnya. Pembeli juga bisa memilih ambil sendiri.'],
  ['Pembayarannya bagaimana?', 'Tunai saat barang tiba (COD) atau transfer langsung ke rekening/e-wallet penjual — uang tidak lewat kami. Untuk transfer, pembeli memotret bukti lalu mengirimnya ke WhatsApp penjual. Setelah penjual menandai lunas, nota terkirim ke WhatsApp pembeli.'],
  ['Apakah foto bukti & nota disimpan di server?', 'Tidak. Bukti transfer dan nota tersimpan di HP penjual dan pembeli, lalu dikirim lewat WhatsApp. Server hanya mencatat pesanan dan status lunasnya — ringan dan hemat kuota.'],
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
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Untuk warung & usaha kecil
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-extrabold tracking-[-0.035em] text-stone-900 sm:text-5xl lg:text-6xl">
              <WordRise text="Warung Anda bisa terima" startDelay={120} />
              <span className="relative inline-block text-brand-600">
                <WordRise text="pesan antar." startDelay={400} />
                <svg className="underline-draw absolute -bottom-2 left-0 w-full" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden>
                  <path d="M3 10 C 80 2, 200 2, 297 8" fill="none" stroke="#e8590c" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
                </svg>
              </span>
            </h1>
            <p className="word-rise mx-auto mt-5 max-w-lg text-lg text-stone-600 md:mx-0" style={{ animationDelay: '520ms' }}>
              Pelanggan pesan dari HP, ongkir terhitung otomatis dari jarak, pesanan masuk rapi ke HP Anda —
              <b className="text-stone-800"> tanpa potongan sepeser pun.</b>
            </p>
            <div className="word-rise mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start" style={{ animationDelay: '640ms' }}>
              <Link to="/seller" className="btn-primary glow-breathe py-3.5 text-base sm:px-6">
                <Icon name="store" className="h-5 w-5" /> Buka toko gratis
              </Link>
              <a href="#cara" className="btn-secondary py-3.5 text-base sm:px-6">
                <Icon name="play" className="h-4 w-4" /> Lihat cara pakai
              </a>
            </div>
            <div className="word-rise mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-stone-500 md:justify-start" style={{ animationDelay: '760ms' }}>
              {['0% komisi', 'Rp0 / bulan', 'Siap dalam 5 menit', 'Ringan di HP sederhana'].map(t => (
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

      {/* ---------------- Rencana: Buka toko dalam 3 langkah ---------------- */}
      <section className="bg-stone-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <Reveal className="text-center">
            <p className="text-sm font-bold tracking-wide text-brand-200 uppercase">Rencananya sederhana</p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Buka toko dalam 3 langkah</h2>
          </Reveal>
          <Reveal className="relative mt-12">
            <div className="line-draw absolute top-7 right-[18%] left-[18%] hidden h-0.5 bg-gradient-to-r from-brand-700 via-brand-500 to-brand-700 md:block" />
            <ol className="relative grid gap-8 md:grid-cols-3">
              {PLAN.map(([ic, t, d], i) => (
                <Reveal key={t} as="li" delay={i * 140} className="text-center">
                  <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 ring-8 ring-stone-900">
                    <Icon name={ic} className="h-7 w-7" />
                  </span>
                  <p className="mt-4 text-sm font-bold text-brand-200">Langkah {i + 1}</p>
                  <p className="mt-1 text-xl font-extrabold">{t}</p>
                  <p className="mx-auto mt-1 max-w-[260px] text-stone-400">{d}</p>
                </Reveal>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={300} className="mt-12 text-center">
            <Link to="/seller" className="btn-primary px-7 py-3.5 text-base">Buka toko gratis <Icon name="arrow" className="h-4 w-4" /></Link>
          </Reveal>
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

      {/* ---------------- Pembayaran & nota ---------------- */}
      <section id="bayar" className="scroll-mt-16 bg-[#fbf6f0]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2">
          <div>
            <Reveal><p className="text-sm font-bold tracking-wide text-brand-700 uppercase">Pembayaran beres</p></Reveal>
            <Reveal delay={80}>
              <h2 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight">Lunas tercatat.<br />Nota terkirim ke WhatsApp.</h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 text-lg text-stone-600">
                Tidak ada lagi bukti transfer yang tenggelam di chat atau nota tulis tangan. Satu ketukan, pelanggan menerima nota rapi.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {([
                ['cash', 'Tunai (COD)', ['Antar & terima uang', 'Ketuk "Sudah terima pembayaran"', 'Kirim nota ke WhatsApp pembeli']],
                ['camera', 'Transfer', ['Pembeli memotret bukti dari kamera', 'Bukti dikirim ke WhatsApp Anda', 'Cek, ketuk "Pembayaran diterima", kirim nota']],
              ] as const).map(([ic, t, steps], i) => (
                <Reveal key={t} delay={240 + i * 120} className="card p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white"><Icon name={ic} className="h-5 w-5" /></span>
                  <p className="mt-3 font-extrabold">{t}</p>
                  <ol className="mt-2 space-y-1.5 text-sm text-stone-600">
                    {steps.map((st, k) => (
                      <li key={st} className="flex gap-2"><span className="font-bold text-brand-700">{k + 1}.</span>{st}</li>
                    ))}
                  </ol>
                </Reveal>
              ))}
            </div>
            <Reveal delay={480}>
              <p className="mt-6 flex items-start gap-2 text-sm text-stone-500">
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                Foto bukti & nota tersimpan di HP masing-masing, bukan di server — ringan dan hemat kuota.
              </p>
            </Reveal>
          </div>
          <NotaVisual />
        </div>
      </section>

      {/* ---------------- Sebelum / Sesudah ---------------- */}
      <section className="mx-auto max-w-5xl px-4 pt-20">
        <Reveal className="text-center">
          <p className="text-sm font-bold tracking-wide text-brand-700 uppercase">Bedanya terasa</p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight">Sebelum & sesudah Pesan Antar</h2>
        </Reveal>
        <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-stone-200">
          <div className="grid grid-cols-[0.7fr_1fr_1fr] bg-stone-50 text-sm font-bold">
            <span className="p-4" />
            <span className="flex items-center gap-2 p-4 text-stone-500"><Icon name="x" className="h-4 w-4 text-red-500" strokeWidth={2.6} /> Sebelum</span>
            <span className="flex items-center gap-2 bg-brand-50 p-4 text-brand-700"><Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> Sesudah</span>
          </div>
          {BEFORE_AFTER.map(([k, before, after], i) => (
            <Reveal key={k} delay={i * 90} className="grid grid-cols-[0.7fr_1fr_1fr] border-t border-stone-200 text-sm md:text-base">
              <span className="p-4 font-bold">{k}</span>
              <span className="p-4 text-stone-500 line-through decoration-stone-300">{before}</span>
              <span className="bg-brand-50/60 p-4 font-semibold text-stone-900">{after}</span>
            </Reveal>
          ))}
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
            Jadilah warung andalan kampung yang bisa antar.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-brand-100">
            Pelanggan langganan pesan dari rumah, pesanan masuk rapi, untung tetap utuh. Siap dalam 5 menit.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/seller" className="btn bg-white py-3.5 text-base text-brand-700 shadow-lg hover:bg-brand-50 sm:px-6">
              <Icon name="store" className="h-5 w-5" /> Buka toko gratis
            </Link>
            <InstallButton className="btn border border-white/40 py-3.5 text-base text-white hover:bg-white/10 sm:px-6" label="Download aplikasi" />
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

/** Gambaran sukses: chat WhatsApp berisi bukti transfer & nota lunas. */
function NotaVisual() {
  return (
    <Reveal delay={150} className="relative mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-[#efeae2] shadow-2xl">
        <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">D</span>
          <div>
            <p className="text-sm font-bold">Dimas</p>
            <p className="text-xs opacity-80">online</p>
          </div>
        </div>
        <div className="space-y-3 p-4">
          <Reveal delay={300} className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-white p-2 shadow-sm">
              <div className="flex h-32 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white"><Icon name="check" className="h-4 w-4" strokeWidth={3} /></span>
                <span className="text-[10px] font-bold text-sky-900">Transfer berhasil</span>
                <span className="text-xs font-extrabold text-sky-900">Rp13.500</span>
              </div>
              <p className="px-1 pt-1.5 text-xs">Bukti transfer PA-7F3K2Q</p>
            </div>
          </Reveal>
          <Reveal delay={550} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#d9fdd3] p-2 shadow-sm">
              <div className="relative w-44 overflow-hidden rounded-lg bg-white p-3 shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-brand-600" />
                <p className="text-xs font-extrabold">Warung Bu Sri</p>
                <p className="mt-0.5 text-[9px] font-bold text-brand-700">NOTA PEMBELIAN • INV-7F3K2Q</p>
                <div className="mt-2 space-y-1 text-[10px] text-stone-600">
                  <p className="flex justify-between"><span>2× Indomie Goreng</span><span>Rp7.000</span></p>
                  <p className="flex justify-between"><span>1× Telur Ayam</span><span>Rp2.500</span></p>
                  <p className="flex justify-between"><span>1× Es Teh Manis</span><span>Rp4.000</span></p>
                  <p className="flex justify-between border-t border-dashed border-stone-300 pt-1 font-bold text-stone-900"><span>Total</span><span>Rp13.500</span></p>
                </div>
                <span className="absolute top-3 right-2 rotate-[-14deg] rounded border-2 border-emerald-600 px-1 text-[10px] font-black tracking-wider text-emerald-600">LUNAS</span>
              </div>
              <p className="px-1 pt-1.5 text-xs">Terima kasih, pembayaran sudah kami terima</p>
            </div>
          </Reveal>
        </div>
      </div>
      <div className="float-slow absolute -top-4 -right-3 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg md:-right-8">
        Nota terkirim 1 ketukan
      </div>
    </Reveal>
  );
}

function Nav({ hasOrders }: { hasOrders: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <img src="/icon-192.png" alt="" className="h-9 w-9 rounded-xl" />
        <span className="text-lg font-extrabold tracking-tight">Pesan Antar</span>
        <nav className="ml-8 hidden gap-6 text-sm font-medium text-stone-600 lg:flex">
          {[['#cerita', 'Kenapa'], ['#fitur', 'Fitur'], ['#ongkir', 'Ongkir'], ['#bayar', 'Pembayaran'], ['#cara', 'Cara pakai'], ['#faq', 'FAQ']].map(([h, l]) => (
            <a key={h} href={h} className="transition-colors hover:text-stone-900">{l}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {hasOrders && <Link to="/pesanan" className="btn-ghost hidden !px-3 sm:inline-flex">Pesanan saya</Link>}
          <Link to="/download" className="btn-ghost hidden !px-3 sm:inline-flex"><Icon name="download" className="h-4 w-4" /> Download</Link>
          <Link to="/seller" className="btn-primary !px-4 !py-2">Buka toko gratis</Link>
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
