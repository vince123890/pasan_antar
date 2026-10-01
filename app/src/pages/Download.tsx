import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InstallButton, InstallSteps } from '../components/Install';
import { detectPlatform, type Platform } from '../lib/install';

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: 'android', label: 'Android' },
  { key: 'ios', label: 'iPhone' },
  { key: 'desktop', label: 'Komputer' },
];

export default function Download() {
  const [platform, setPlatform] = useState<Platform>(detectPlatform);
  const [qr, setQr] = useState('');
  const url = `${window.location.origin}/download`;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 440, margin: 1 }).then(setQr);
  }, [url]);

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-12">
      <section className="bg-brand-600 px-6 pt-8 pb-16 text-white">
        <Link to="/" className="text-sm text-brand-100">← Beranda</Link>
        <div className="mt-6 flex items-center gap-4">
          <img src="/icon-192.png" alt="" className="h-20 w-20 rounded-3xl shadow-lg ring-4 ring-white/20" />
          <div>
            <h1 className="text-2xl font-extrabold">Pesan Antar</h1>
            <p className="text-brand-100">Untuk penjual & pembeli</p>
          </div>
        </div>
      </section>

      <div className="-mt-10 space-y-4 px-4">
        <section className="card p-5 shadow-sm">
          <InstallButton className="btn-primary w-full py-3.5 text-base" label="Download / Install aplikasi" />
          <p className="mt-3 text-center text-xs text-stone-500">Gratis • &lt;1 MB • tanpa Play Store • otomatis selalu terbaru</p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-2xl">🏪</p>
            <p className="mt-1 font-bold">Penjual</p>
            <p className="mt-1 text-xs text-stone-600">Terima pesanan dengan bunyi, atur produk & ongkir.</p>
            <Link to="/seller" className="mt-3 inline-block text-sm font-semibold text-brand-700">Buka →</Link>
          </div>
          <div className="card p-4">
            <p className="text-2xl">🛒</p>
            <p className="mt-1 font-bold">Pembeli</p>
            <p className="mt-1 text-xs text-stone-600">Pesan dari toko langganan, lacak sampai tiba.</p>
            <Link to="/pesanan" className="mt-3 inline-block text-sm font-semibold text-brand-700">Pesanan saya →</Link>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-bold">Cara pasang manual</h2>
          <div className="mt-3 mb-4 flex gap-2">
            {PLATFORMS.map(p => (
              <button key={p.key} onClick={() => setPlatform(p.key)} className={`chip ${platform === p.key ? 'chip-active' : ''}`}>
                {p.label}
              </button>
            ))}
          </div>
          <InstallSteps platform={platform} />
        </section>

        <section className="card hidden flex-col items-center p-5 text-center sm:flex">
          <h2 className="font-bold">Buka di HP</h2>
          <p className="mt-1 text-sm text-stone-600">Scan QR ini dengan kamera HP</p>
          {qr && <img src={qr} alt="QR halaman download" className="mt-3 w-44" />}
        </section>
      </div>
    </div>
  );
}
