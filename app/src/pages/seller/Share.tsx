import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { StoreAvatar, toast } from '../../components/ui';
import { waShare } from '../../lib/format';
import { useSeller } from '../../lib/seller';

export default function Share() {
  const { store } = useSeller();
  const url = `${window.location.origin}/t/${store.slug}`;
  const [qr, setQr] = useState('');

  useEffect(() => {
    QRCode.toDataURL(url, { width: 640, margin: 1, color: { dark: '#1c1917', light: '#ffffff' } }).then(setQr);
  }, [url]);

  const message = `Sekarang bisa pesan antar dari ${store.name} 🛵\nLihat menu & pesan di sini:\n${url}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('Link disalin', 'success');
    } catch {
      toast('Gagal menyalin, salin manual ya', 'error');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: store.name, text: message, url });
    } catch { /* dibatalkan */ }
  };

  return (
    <div className="space-y-4 p-4">
      <section className="card p-4">
        <p className="text-sm text-stone-600">Link toko Anda</p>
        <p className="mt-1 break-all font-semibold text-brand-700">{url}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="btn-secondary" onClick={copy}>Salin link</button>
          <a className="btn-wa" href={waShare(message)} target="_blank" rel="noreferrer">Kirim ke WA</a>
        </div>
        {'share' in navigator && <button className="btn-ghost mt-2 w-full" onClick={nativeShare}>Bagikan lainnya…</button>}
        <a className="btn-ghost mt-1 w-full" href={url} target="_blank" rel="noreferrer">Lihat toko seperti pembeli ↗</a>
      </section>

      <section id="qr-card" className="card flex flex-col items-center p-6 text-center print:border-0">
        <StoreAvatar name={store.name} url={store.logo_url} size="h-14 w-14" />
        <p className="mt-2 text-xl font-bold">{store.name}</p>
        <p className="text-sm text-stone-600">Scan untuk pesan antar 🛵</p>
        {qr ? <img src={qr} alt="QR toko" className="mt-4 w-56" /> : <div className="mt-4 h-56 w-56 animate-pulse bg-stone-100" />}
        <p className="mt-2 text-xs break-all text-stone-500">{url}</p>
      </section>

      <div className="grid grid-cols-2 gap-2 print:hidden">
        <a className="btn-secondary" href={qr} download={`qr-${store.slug}.png`}>Unduh QR</a>
        <button className="btn-secondary" onClick={() => window.print()}>Cetak</button>
      </div>
      <p className="text-center text-xs text-stone-500 print:hidden">Tempel QR di meja kasir atau etalase agar pembeli mudah memesan.</p>
    </div>
  );
}
