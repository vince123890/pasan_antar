import { useState } from 'react';
import { Link } from 'react-router-dom';
import { detectPlatform, isIosNonSafari, promptInstall, useInstall, type Platform } from '../lib/install';
import { getPref, setPref } from '../lib/local';
import { Icon } from './Icon';
import { Sheet, toast } from './ui';

/** Tombol "Install aplikasi": prompt langsung bila didukung, selain itu tampilkan panduan. */
export function InstallButton({ className = 'btn-primary', label = 'Install aplikasi' }: { className?: string; label?: string }) {
  const { canPrompt, installed } = useInstall();
  const [guide, setGuide] = useState(false);

  if (installed) return <span className="text-sm font-medium text-emerald-700">✓ Aplikasi sudah terpasang</span>;

  const onClick = async () => {
    if (canPrompt) {
      const ok = await promptInstall();
      if (ok) toast('Aplikasi dipasang di layar utama 🎉', 'success');
    } else {
      setGuide(true);
    }
  };

  return (
    <>
      <button className={className} onClick={onClick}><Icon name="download" className="h-[1.1em] w-[1.1em]" /> {label}</button>
      <Sheet open={guide} onClose={() => setGuide(false)} title="Pasang aplikasi">
        <InstallSteps platform={detectPlatform()} />
      </Sheet>
    </>
  );
}

export function InstallSteps({ platform }: { platform: Platform }) {
  const steps: Record<Platform, [string, string][]> = {
    ios: [
      ['1', 'Buka halaman ini di Safari'],
      ['2', 'Ketuk tombol Bagikan (kotak dengan panah ke atas ⬆️) di bawah layar'],
      ['3', 'Gulir lalu pilih "Tambah ke Layar Utama"'],
      ['4', 'Ketuk "Tambah" — ikon Pesan Antar muncul di layar utama'],
    ],
    android: [
      ['1', 'Buka halaman ini di Chrome'],
      ['2', 'Ketuk menu ⋮ di kanan atas'],
      ['3', 'Pilih "Instal aplikasi" atau "Tambahkan ke layar utama"'],
      ['4', 'Ketuk "Instal" — ikon Pesan Antar muncul di layar utama'],
    ],
    desktop: [
      ['1', 'Buka di Chrome atau Edge'],
      ['2', 'Klik ikon instal (⊕ / monitor dengan panah) di ujung kanan kolom alamat'],
      ['3', 'Klik "Instal"'],
    ],
  };
  return (
    <div>
      {platform === 'ios' && isIosNonSafari() && (
        <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Jika menu "Tambah ke Layar Utama" tidak ada, salin link ini lalu buka di <b>Safari</b>.
        </p>
      )}
      <ol className="space-y-3">
        {steps[platform].map(([n, text]) => (
          <li key={n} className="flex gap-3 text-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</span>
            <span className="pt-1 text-stone-800">{text}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-stone-500">
        Ukuran kecil (&lt;1 MB) dan otomatis selalu versi terbaru.
      </p>
    </div>
  );
}

/** Banner kecil yang bisa ditutup, untuk beranda & aplikasi penjual. */
export function InstallBanner({ context }: { context: 'buyer' | 'seller' }) {
  const { installed } = useInstall();
  const key = `install_banner_${context}`;
  const [hidden, setHidden] = useState(() => getPref(key, false));
  if (installed || hidden) return null;
  const dismiss = () => { setPref(key, true); setHidden(true); };
  return (
    <div className="flex items-center gap-3 border-b border-brand-100 bg-brand-50 px-4 py-2.5">
      <img src="/icon-192.png" alt="" className="h-9 w-9 rounded-xl" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-stone-900">Pasang aplikasi Pesan Antar</p>
        <p className="truncate text-xs text-stone-600">
          {context === 'seller' ? 'Buka toko lebih cepat & dengar pesanan masuk' : 'Pesan lebih cepat dari layar utama'}
        </p>
      </div>
      <InstallButton className="btn-primary !px-3 !py-1.5 text-xs" label="Install" />
      <button onClick={dismiss} className="text-stone-400" aria-label="Tutup">✕</button>
    </div>
  );
}

export function DownloadLink() {
  return <Link to="/download" className="font-semibold text-brand-700">Download aplikasi</Link>;
}
