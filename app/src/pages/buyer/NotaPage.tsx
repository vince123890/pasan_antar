// Nota / invoice pembelian — bisa dicetak, disimpan sebagai PDF, atau dibagikan.
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Empty, PageLoading, StoreAvatar, toast } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { displayWa, rupiah } from '../../lib/format';
import { getInvoice, saveInvoice } from '../../lib/local';
import { downloadBlob, renderInvoicePng, toInvoice } from '../../lib/receipt';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem } from '../../lib/types';

interface NotaData {
  order: Order;
  items: OrderItem[];
  store: { name: string; slug: string; wa_phone: string; address?: string | null; logo_url?: string | null };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function NotaPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const token = params.get('k') ?? '';
  const [data, setData] = useState<NotaData | null | undefined>(undefined);
  const [localImg, setLocalImg] = useState<string | null>(null);

  useEffect(() => {
    supabase.rpc('get_order_by_token', { p_order_id: id, p_token: token }).then(async ({ data: res, error }) => {
      const d = (res as NotaData | null) ?? null;
      if (d?.order.payment_status === 'paid') saveInvoice(toInvoice(d.order, d.items, d.store)); // salinan di HP
      if (!d) {
        // Offline / gagal: tampilkan salinan nota yang tersimpan di HP
        const inv = getInvoice(id);
        if (inv) setLocalImg(URL.createObjectURL(await renderInvoicePng(inv)));
        else if (error) toast(toAppError(error).message, 'error');
      }
      setData(d);
    });
  }, [id, token]);

  if (data === undefined) return <PageLoading />;
  if (!data && localImg) {
    return (
      <div className="min-h-dvh bg-stone-100 px-4 py-6">
        <p className="mx-auto mb-3 max-w-md text-center text-sm text-stone-600">Nota tersimpan di HP ini</p>
        <img src={localImg} alt="Nota" className="mx-auto w-full max-w-md rounded-lg shadow-sm" />
        <a href={localImg} download={`nota-${id.slice(0, 8)}.png`} className="btn-primary mx-auto mt-4 flex max-w-md">Simpan gambar</a>
      </div>
    );
  }
  if (!data) {
    return <div className="mx-auto max-w-lg pt-16"><Empty icon="🧾" title="Nota tidak ditemukan">Link nota tidak valid.</Empty></div>;
  }

  const { order, items, store } = data;
  const paid = order.payment_status === 'paid';
  const invoiceNo = `INV-${order.code.replace(/^PA-/, '')}`;
  const url = window.location.href;

  const saveImage = async () => {
    const inv = getInvoice(order.id) ?? toInvoice(order, items, store);
    downloadBlob(await renderInvoicePng(inv), `nota-${inv.invoiceNo}.png`);
    toast('Gambar nota tersimpan di HP', 'success');
  };

  const share = async () => {
    const text = `Nota ${invoiceNo} dari ${store.name} — ${rupiah(order.total)}`;
    try {
      if (navigator.share) await navigator.share({ title: `Nota ${invoiceNo}`, text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link nota disalin', 'success');
      }
    } catch { /* dibatalkan */ }
  };

  return (
    <div className="min-h-dvh bg-stone-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-md items-center justify-between px-4 print:hidden">
        <Link to={`/o/${order.id}?k=${token}`} className="text-sm text-stone-600">← Pesanan</Link>
        <div className="flex gap-2">
          <button className="btn-secondary !py-2" onClick={saveImage}>Simpan gambar</button>
          <button className="btn-secondary !py-2" onClick={share}>Bagikan</button>
          <button className="btn-primary !py-2" onClick={() => window.print()}>Cetak / PDF</button>
        </div>
      </div>

      <article className="relative mx-auto max-w-md overflow-hidden bg-white px-6 py-7 shadow-sm print:max-w-none print:shadow-none">
        {paid && (
          <div className="pointer-events-none absolute top-24 right-4 rotate-[-14deg] rounded-lg border-4 border-emerald-600/70 px-3 py-1 text-2xl font-extrabold tracking-widest text-emerald-600/70">
            LUNAS
          </div>
        )}

        <header className="flex items-center gap-3 border-b border-dashed border-stone-300 pb-4">
          <StoreAvatar name={store.name} url={store.logo_url ?? null} size="h-12 w-12" />
          <div className="min-w-0">
            <p className="text-lg font-extrabold">{store.name}</p>
            {store.address && <p className="text-xs text-stone-500">{store.address}</p>}
            <p className="text-xs text-stone-500">WA {displayWa(store.wa_phone)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-y-1 py-4 text-sm">
          <span className="text-stone-500">No. nota</span><span className="text-right font-semibold">{invoiceNo}</span>
          <span className="text-stone-500">Tanggal pesan</span><span className="text-right">{fmtDate(order.created_at)}</span>
          <span className="text-stone-500">Pembeli</span><span className="text-right">{order.buyer_name}</span>
          <span className="text-stone-500">Pengiriman</span>
          <span className="text-right">{order.fulfillment === 'delivery' ? `Diantar ±${order.distance_km ?? '-'} km` : 'Ambil sendiri'}</span>
          {order.address && <><span className="text-stone-500">Alamat</span><span className="text-right">{order.address}</span></>}
        </section>

        <table className="w-full border-y border-dashed border-stone-300 text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500">
              <th className="py-2 font-medium">Barang</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {items.map(i => (
              <tr key={i.id} className="align-top">
                <td className="py-1.5">
                  {i.name}
                  <span className="block text-xs text-stone-500">@ {rupiah(i.price)}{i.note ? ` • ${i.note}` : ''}</span>
                </td>
                <td className="py-1.5 text-right tabular-nums">{i.qty}</td>
                <td className="py-1.5 text-right tabular-nums">{rupiah(i.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="space-y-1 py-4 text-sm">
          <div className="flex justify-between"><dt className="text-stone-500">Subtotal</dt><dd className="tabular-nums">{rupiah(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">Ongkir</dt><dd className="tabular-nums">{order.delivery_fee ? rupiah(order.delivery_fee) : 'Gratis'}</dd></div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold"><dt>Total</dt><dd className="tabular-nums">{rupiah(order.total)}</dd></div>
        </dl>

        <section className="rounded-xl bg-stone-50 p-3 text-sm print:bg-white print:p-0">
          <div className="flex justify-between">
            <span className="text-stone-500">Metode bayar</span>
            <span className="font-semibold">{order.payment_method === 'cod' ? 'Tunai (COD)' : 'Transfer'}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-stone-500">Status</span>
            <span className={`font-semibold ${paid ? 'text-emerald-700' : 'text-amber-700'}`}>
              {paid ? `Lunas${order.paid_at ? ` • ${fmtDate(order.paid_at)}` : ''}` : 'Belum lunas'}
            </span>
          </div>
        </section>

        <footer className="mt-6 text-center text-xs text-stone-500">
          <p>Terima kasih telah berbelanja di {store.name} 🙏</p>
          <p className="mt-1">Dibuat dengan Pesan Antar</p>
        </footer>
      </article>
    </div>
  );
}
