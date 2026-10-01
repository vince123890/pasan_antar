// Membuat ikon PWA (PNG) tanpa dependensi: kotak oranye + pin lokasi putih.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BRAND = [232, 89, 12];
const WHITE = [255, 255, 255];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

/** Nilai 0..1: seberapa "putih" titik (x,y) dalam koordinat 0..1 */
function pinShape(x, y, scale) {
  // pusatkan & skala
  const u = (x - 0.5) / scale + 0.5;
  const v = (y - 0.5) / scale + 0.5;
  const cx = 0.5, cy = 0.42, r = 0.24;
  const d = Math.hypot(u - cx, v - cy);
  const inHead = d <= r;
  // ekor segitiga dari tangen lingkaran ke ujung (0.5, 0.86)
  const tipY = 0.86;
  const inTail = v >= cy && v <= tipY && Math.abs(u - cx) <= r * (1 - (v - cy) / (tipY - cy)) * 0.95;
  const inHole = d <= r * 0.42;
  return (inHead || inTail) && !inHole ? 1 : 0;
}

function render(size, { maskable = false, rounded = true } = {}) {
  const ss = 4; // supersampling
  const radius = rounded && !maskable ? 0.22 : 0;
  const scale = maskable ? 0.62 : 0.8;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      let bg = 0, fg = 0;
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const x = (px + (sx + 0.5) / ss) / size;
        const y = (py + (sy + 0.5) / ss) / size;
        // rounded rect
        const qx = Math.max(Math.abs(x - 0.5) - (0.5 - radius), 0);
        const qy = Math.max(Math.abs(y - 0.5) - (0.5 - radius), 0);
        const inside = radius === 0 || Math.hypot(qx, qy) <= radius;
        if (!inside) continue;
        bg++;
        fg += pinShape(x, y, scale);
      }
      const n = ss * ss;
      const a = bg / n;
      const f = bg ? fg / bg : 0;
      const o = py * (size * 4 + 1) + 1 + px * 4;
      for (let k = 0; k < 3; k++) raw[o + k] = Math.round(BRAND[k] * (1 - f) + WHITE[k] * f);
      raw[o + 3] = Math.round(a * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = new URL('../public/', import.meta.url);
writeFileSync(new URL('icon-192.png', out), render(192));
writeFileSync(new URL('icon-512.png', out), render(512));
writeFileSync(new URL('icon-maskable-512.png', out), render(512, { maskable: true }));
writeFileSync(new URL('apple-touch-icon.png', out), render(180, { rounded: false }));
writeFileSync(new URL('favicon.svg', out), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#e8590c"/>
  <path d="M32 9c-9.4 0-17 7.4-17 16.6C15 38 32 55 32 55s17-17 17-29.4C49 16.4 41.4 9 32 9z" fill="#fff"/>
  <circle cx="32" cy="25.5" r="6.5" fill="#e8590c"/>
</svg>
`);
console.log('Ikon dibuat di public/');
