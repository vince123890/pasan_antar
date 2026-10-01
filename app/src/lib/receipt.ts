// Nota pembelian dibuat di HP (canvas → PNG) dan dikirim lewat WhatsApp.
// Server tidak menyimpan file apa pun.
import { rupiah, waLink, waShare } from './format';
import type { InvoiceSnapshot } from './local';
import type { Order, OrderItem } from './types';

export const invoiceNo = (code: string) => `INV-${code.replace(/^PA-/, '')}`;

export function toInvoice(
  order: Order,
  items: OrderItem[],
  store: { name: string; address?: string | null; wa_phone: string },
): InvoiceSnapshot {
  return {
    orderId: order.id,
    invoiceNo: invoiceNo(order.code),
    store: { name: store.name, address: store.address ?? null, wa_phone: store.wa_phone },
    buyer_name: order.buyer_name,
    created_at: order.created_at,
    paid_at: order.paid_at,
    fulfillment: order.fulfillment,
    distance_km: order.distance_km,
    address: order.address,
    items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price, line_total: i.line_total, note: i.note })),
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    total: order.total,
    payment_method: order.payment_method,
  };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Gambar nota (PNG) dari snapshot — dibuat di HP. */
export async function renderInvoicePng(inv: InvoiceSnapshot): Promise<Blob> {
  try {
    await Promise.all([600, 800].map(w => document.fonts.load(`${w} 20px "Plus Jakarta Sans Variable"`)));
  } catch { /* pakai font sistem */ }
  const W = 720;
  const P = 40;
  const font = (w: number, s: number) => `${w} ${s}px "Plus Jakarta Sans Variable", system-ui, sans-serif`;
  const lineH = 34;
  const height = 900 + inv.items.length * 60; // digambar longgar, lalu dipotong sesuai isi
  const scale = 2;
  const c = document.createElement('canvas');
  c.width = W * scale;
  c.height = height * scale;
  const g = c.getContext('2d')!;
  g.scale(scale, scale);

  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, height);
  g.fillStyle = '#e8590c';
  g.fillRect(0, 0, W, 10);

  let y = 62;
  const text = (t: string, x: number, f: string, color = '#1c1917', align: CanvasTextAlign = 'left') => {
    g.font = f; g.fillStyle = color; g.textAlign = align; g.fillText(t, x, y);
  };
  const dashed = () => {
    g.strokeStyle = '#d6d3d1'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(P, y); g.lineTo(W - P, y); g.stroke(); g.setLineDash([]);
  };
  const row = (k: string, v: string, bold = false) => {
    text(k, P, font(500, 20), '#78716c');
    text(v, W - P, font(bold ? 800 : 600, bold ? 24 : 20), '#1c1917', 'right');
    y += lineH;
  };

  text(inv.store.name, P, font(800, 32));
  y += 32;
  if (inv.store.address) { text(inv.store.address.slice(0, 60), P, font(500, 18), '#78716c'); y += 26; }
  text(`WA 0${inv.store.wa_phone.replace(/^62/, '')}`, P, font(500, 18), '#78716c');
  y += 26;
  dashed();
  y += 40;

  text('NOTA PEMBELIAN', P, font(800, 22), '#e8590c');
  y += lineH + 4;
  row('No. nota', inv.invoiceNo);
  row('Tanggal', fmtDate(inv.created_at));
  row('Pembeli', inv.buyer_name);
  row('Pengiriman', inv.fulfillment === 'delivery' ? `Diantar ±${inv.distance_km ?? '-'} km` : 'Ambil sendiri');
  if (inv.address) row('Alamat', inv.address.length > 34 ? inv.address.slice(0, 33) + '…' : inv.address);
  y += 4;
  dashed();
  y += 40;

  for (const it of inv.items) {
    text(it.name.length > 30 ? it.name.slice(0, 29) + '…' : it.name, P, font(600, 20));
    text(rupiah(it.line_total), W - P, font(600, 20), '#1c1917', 'right');
    y += 24;
    text(`${it.qty} × ${rupiah(it.price)}`, P, font(500, 16), '#78716c');
    y += 28;
  }
  dashed();
  y += 40;
  row('Subtotal', rupiah(inv.subtotal));
  row('Ongkir', inv.delivery_fee ? rupiah(inv.delivery_fee) : 'Gratis');
  row('Total', rupiah(inv.total), true);
  y += 6;
  row('Pembayaran', inv.payment_method === 'cod' ? 'Tunai (COD)' : 'Transfer');
  row('Status', inv.paid_at ? `Lunas • ${fmtDate(inv.paid_at)}` : 'Belum lunas');

  if (inv.paid_at) {
    g.save();
    g.translate(W - 120, 64);
    g.rotate(-0.25);
    g.strokeStyle = 'rgba(5,150,105,0.75)';
    g.lineWidth = 5;
    g.strokeRect(-80, -34, 160, 60);
    g.font = font(800, 34);
    g.fillStyle = 'rgba(5,150,105,0.75)';
    g.textAlign = 'center';
    g.fillText('LUNAS', 0, 8);
    g.restore();
  }

  y += 24;
  text(`Terima kasih telah berbelanja di ${inv.store.name}`, W / 2, font(500, 18), '#78716c', 'center');
  y += 26;
  text('Dibuat dengan Pesan Antar', W / 2, font(500, 15), '#a8a29e', 'center');

  // Potong kanvas sesuai tinggi isi
  const finalH = Math.ceil(y + 30);
  const out = document.createElement('canvas');
  out.width = W * scale;
  out.height = finalH * scale;
  out.getContext('2d')!.drawImage(c, 0, 0, W * scale, finalH * scale, 0, 0, W * scale, finalH * scale);
  return new Promise((resolve, reject) => out.toBlob(b => (b ? resolve(b) : reject(new Error('Gagal membuat gambar nota'))), 'image/png'));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Kirim gambar + teks lewat WhatsApp.
 * - HP yang mendukung berbagi file (Android Chrome, iOS Safari): buka menu Bagikan → pilih WhatsApp & chat tujuan.
 * - Selain itu: gambar diunduh, lalu WhatsApp dibuka ke nomor tujuan dengan teks — lampirkan gambar dari galeri.
 */
export async function shareImageViaWhatsApp(blob: Blob, filename: string, text: string, phone?: string): Promise<'shared' | 'fallback' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  downloadBlob(blob, filename);
  window.open(phone ? waLink(phone, text) : waShare(text), '_blank');
  return 'fallback';
}
