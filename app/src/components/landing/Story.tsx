// Cerita brand: kenapa Pesan Antar dibuat (dari kebutuhan warung kecil).
import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import { CountUp, Reveal, useInView } from './motion';

function Chapter({ n, kicker, title, children, visual, flip = false }: {
  n: string; kicker: string; title: string; children: ReactNode; visual: ReactNode; flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 py-14 md:grid-cols-2 md:gap-16 md:py-20">
      <div className={flip ? 'md:order-2' : ''}>
        <Reveal>
          <p className="flex items-center gap-3 text-sm font-bold tracking-wide text-brand-700 uppercase">
            <span className="text-4xl font-extrabold text-stone-200 tabular-nums">{n}</span>{kicker}
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h3 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight text-stone-900 md:text-4xl">{title}</h3>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-4 space-y-3 text-lg leading-relaxed text-stone-600">{children}</div>
        </Reveal>
      </div>
      <div className={flip ? 'md:order-1' : ''}>{visual}</div>
    </div>
  );
}

const CHAT = [
  { me: false, text: 'Bu, indomie goreng 2 ya', t: '19.02' },
  { me: false, text: 'sama telur 1', t: '19.02' },
  { me: true, text: 'Iya mas, alamatnya?', t: '19.05' },
  { me: false, text: 'yg kemarin bu, gang sebelah masjid', t: '19.07' },
  { me: false, text: 'eh indomienya jadi 3 deh', t: '19.08' },
  { me: false, text: 'ongkirnya brp bu?', t: '19.08' },
  { me: true, text: 'Bentar ya mas, saya hitung dulu 🙏', t: '19.15' },
];

function ChatChaos() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  return (
    <div ref={ref} className="relative mx-auto max-w-sm">
      <div className="rounded-[2rem] border border-stone-200 bg-[#efeae2] p-4 shadow-xl">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-300 text-sm font-bold text-white">D</span>
          <div className="text-sm">
            <p className="font-bold">Dimas (pelanggan)</p>
            <p className="text-xs text-stone-500">mengetik…</p>
          </div>
        </div>
        <div className="space-y-2">
          {CHAT.map((m, i) => (
            <div key={i} className={`flex ${m.me ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm shadow-sm transition-all duration-700 ${m.me ? 'rounded-tr-sm bg-[#d9fdd3]' : 'rounded-tl-sm bg-white'}`}
                style={{
                  transitionTimingFunction: 'var(--ease-out)',
                  transitionDelay: `${i * 260}ms`,
                  opacity: inView ? 1 : 0,
                  transform: inView ? 'none' : `translateY(14px) scale(0.92) rotate(${i % 2 ? 1.5 : -1.5}deg)`,
                }}
              >
                {m.text}
                <span className="ml-2 align-bottom text-[10px] text-stone-400">{m.t}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="absolute -right-3 -bottom-5 rotate-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 shadow-lg transition-all duration-700 md:-right-8"
        style={{ transitionDelay: `${CHAT.length * 260 + 200}ms`, opacity: inView ? 1 : 0, transform: inView ? 'rotate(3deg)' : 'rotate(3deg) translateY(16px)' }}
      >
        2 atau 3 indomie? Alamat yang mana?
      </div>
    </div>
  );
}

function CommissionCompare() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <Reveal className="card p-5">
        <p className="text-sm font-semibold text-stone-500">Penjualan Rp100.000 lewat aplikasi berkomisi</p>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-stone-100">
          <div className="flex h-full">
            <div className="h-full w-[80%] bg-stone-400" />
            <div className="h-full w-[20%] bg-red-400" />
          </div>
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span>Diterima warung <b className="text-stone-900">±<CountUp to={80000} prefix="Rp" /></b></span>
          <span className="text-red-600">komisi ±20%</span>
        </div>
      </Reveal>
      <Reveal delay={150} className="card border-brand-200 p-5 ring-2 ring-brand-100">
        <p className="text-sm font-semibold text-brand-700">Penjualan Rp100.000 lewat Pesan Antar</p>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-brand-50">
          <div className="line-draw h-full w-full rounded-full bg-brand-600" />
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span>Diterima warung <b className="text-stone-900"><CountUp to={100000} prefix="Rp" /></b></span>
          <span className="font-semibold text-emerald-700">komisi Rp0</span>
        </div>
      </Reveal>
      <Reveal delay={300}>
        <p className="text-center text-xs text-stone-500">Ilustrasi. Besaran komisi aplikasi lain berbeda-beda.</p>
      </Reveal>
    </div>
  );
}

function CleanOrder() {
  return (
    <Reveal className="relative mx-auto max-w-sm">
      <div className="float-slow rounded-[2rem] border border-stone-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">Dimas</p>
            <p className="text-xs text-stone-500">PA-7F3K2Q • 19.02</p>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Baru</span>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {[['3×', 'Indomie Goreng', 'Rp10.500'], ['1×', 'Telur Ayam', 'Rp2.500']].map(([q, n, p]) => (
            <li key={n} className="flex gap-3"><b className="w-6 text-brand-700">{q}</b><span className="flex-1">{n}</span><span className="tabular-nums">{p}</span></li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold"><Icon name="pin" className="h-4 w-4 text-stone-500" /> Gang sebelah masjid • ±1,2 km</p>
          <p className="mt-1 text-stone-500">Titik lokasi di peta ✓</p>
        </div>
        <div className="mt-4 flex justify-between border-t border-stone-100 pt-3 font-bold">
          <span>Total (gratis ongkir)</span><span className="tabular-nums">Rp13.000</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-semibold">
          <span className="col-span-2 rounded-xl bg-brand-600 py-2.5 text-center text-white">Terima</span>
          <span className="rounded-xl border border-red-200 py-2.5 text-center text-red-700">Tolak</span>
        </div>
      </div>
      <div className="absolute -top-4 -left-3 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg md:-left-8">
        Masuk dalam 1 ketukan
      </div>
    </Reveal>
  );
}

export default function Story() {
  return (
    <section id="cerita" className="relative scroll-mt-16 overflow-hidden bg-[#fbf6f0]">
      <div className="mx-auto max-w-5xl px-4 pt-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-brand-700 uppercase">Cerita di balik Pesan Antar</p>
          <h2 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight md:text-5xl">
            Dari warung, <span className="text-brand-600">untuk tetangga.</span>
          </h2>
          <p className="mt-4 text-lg text-stone-600">
            Pesan Antar lahir dari pertanyaan sederhana: kenapa warung di ujung gang harus kalah oleh aplikasi besar,
            padahal pelanggannya cuma lima menit jalan kaki?
          </p>
        </Reveal>

        <Chapter n="01" kicker="Jantung kampung" title="Warung selalu ada saat kita butuh."
          visual={
            <div className="grid grid-cols-2 gap-3">
              {([['store', 'Warung kelontong', 'Gas, galon, sembako'], ['bowl', 'Warung makan', 'Nasi, lauk, gorengan'], ['coffee', 'Kopi & angkringan', 'Teman begadang'], ['brick', 'Toko material', 'Paku sampai semen']] as const).map(([ic, t, d], i) => (
                <Reveal key={t} delay={i * 90} className="card p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon name={ic} className="h-6 w-6" /></span>
                  <p className="mt-3 font-bold">{t}</p>
                  <p className="text-sm text-stone-500">{d}</p>
                </Reveal>
              ))}
            </div>
          }>
          <p>Gas habis jam sembilan malam, anak minta jajan, tukang butuh paku tambahan — yang menolong selalu warung terdekat.</p>
          <p>Pemiliknya kenal pelanggannya satu per satu. Yang belum ada hanyalah cara mudah untuk <b className="text-stone-800">pesan dari rumah</b>.</p>
        </Chapter>

        <Chapter n="02" kicker="Masalahnya" title="Pesanan antar masih lewat chat yang berantakan." flip visual={<ChatChaos />}>
          <p>Pesanan datang sepotong-sepotong. Jumlah berubah di tengah jalan. Alamat "yang kemarin". Ongkir dihitung kira-kira.</p>
          <p>Penjual sibuk menyalin ulang ke kertas, pembeli menunggu tanpa kepastian. Satu salah baca, satu pesanan kacau.</p>
        </Chapter>

        <Chapter n="03" kicker="Pilihan yang ada" title="Aplikasi besar terlalu mahal untuk warung kecil." visual={<CommissionCompare />}>
          <p>Aplikasi pesan antar besar memotong komisi dari setiap transaksi. Aplikasi kasir berlangganan bisa ratusan ribu per bulan.</p>
          <p>Untuk warung dengan untung tipis, hitungannya <b className="text-stone-800">tidak masuk</b>.</p>
        </Chapter>

        <Chapter n="04" kicker="Jawaban kami" title="Jadi kami buat yang sederhana — dan gratis." flip visual={<CleanOrder />}>
          <p>Pembeli memilih barang dan menandai rumahnya di peta. Ongkir dihitung otomatis dari jarak, sesuai tarif yang penjual atur sendiri.</p>
          <p>Pesanan masuk ke HP penjual dengan bunyi — rapi, lengkap, tanpa salin ulang. Uang dibayar langsung ke penjual.</p>
        </Chapter>
      </div>

      {/* Janji brand */}
      <div className="border-t border-stone-200/70 bg-white/60">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 md:grid-cols-3">
          {([
            ['cash', 'Uang utuh untuk warung', 'Tanpa komisi per pesanan. Pembayaran langsung dari pembeli ke penjual.'],
            ['bolt', 'Ringan di HP & kuota', 'Di bawah 1 MB, tetap bisa dibuka saat sinyal lemah.'],
            ['shield', 'Adil untuk dua pihak', 'Harga & ongkir dihitung ulang di server — tidak ada yang bisa curang.'],
          ] as const).map(([ic, t, d], i) => (
            <Reveal key={t} delay={i * 110} className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white"><Icon name={ic} className="h-6 w-6" /></span>
              <div>
                <p className="font-bold">{t}</p>
                <p className="mt-1 text-sm text-stone-600">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
