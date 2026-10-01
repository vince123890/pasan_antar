# Pesan Antar — MVP (slim)

Aplikasi pesan antar untuk warung & toko kecil. Satu PWA dengan dua sisi:

- **Penjual** (`/seller`): buat toko + pin lokasi, kelola produk & kategori, atur tarif ongkir per jarak, terima pesanan realtime (bunyi + notifikasi), ubah status, bagikan link & QR.
- **Pembeli** (`/t/:slug`): buka toko tanpa daftar, keranjang, checkout dengan ongkir otomatis dari peta/GPS, lacak status realtime, riwayat pesanan.

Stack: Vite + React + TypeScript + Tailwind, Supabase (Postgres, Auth, Realtime, Storage), Leaflet/OpenStreetMap, vite-plugin-pwa. Deploy ke Vercel.

## 1. Siapkan Supabase

1. Buat project di <https://supabase.com> (region Singapore paling dekat).
2. **SQL Editor** → tempel seluruh isi [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
   Ini membuat tabel, RLS, fungsi (ongkir, pesanan, status), realtime, bucket foto, dan kategori toko.
3. **Authentication → Sign In / Providers**:
   - Aktifkan **Allow anonymous sign-ins** (wajib — pembeli memesan tanpa daftar).
   - **Email** sudah aktif secara default (login penjual via link email).
   - Opsional **Google**: isi Client ID & Secret dari Google Cloud Console.
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173` (saat dev) lalu ganti ke domain Vercel.
   - Redirect URLs: tambahkan `http://localhost:5173/**` dan `https://<domain-anda>/**`.
5. **Project Settings → API**: salin **Project URL** dan **anon / publishable key**.

> Email bawaan Supabase dibatasi beberapa email per jam. Untuk produksi, pasang SMTP sendiri (Authentication → Emails → SMTP) atau aktifkan login Google.

## 2. Jalankan lokal

```bash
cp .env.example .env      # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:5173
```

Coba alur lengkap:
1. Buka `/seller` → masuk → buat toko (izinkan lokasi) → tambah produk.
2. Menu **Bagikan** → "Lihat toko seperti pembeli" (buka di jendela **Incognito** / HP lain agar sesi pembeli terpisah).
3. Pesan dari sisi pembeli → pesanan muncul di penjual dengan bunyi → Terima → Antar → Selesai. Status di halaman pembeli ikut berubah.

## 3. Deploy ke Vercel

1. Vercel → **Add New Project** → pilih repo. Root Directory **biarkan default** (`./`) —
   [`vercel.json`](../vercel.json) di root repo sudah mengatur install & build di folder `app/`.
2. **Settings → Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` → **Redeploy**.
   Tanpa env ini landing page & halaman `/download` tetap tampil, tapi fitur toko belum jalan.
3. Kembali ke Supabase → URL Configuration → isi Site URL & Redirect URL dengan domain Vercel.

Setiap push ke `main` otomatis deploy ulang. Fallback SPA sudah diatur agar link `/t/nama-toko` bisa dibuka langsung.

## Download aplikasi

Aplikasi berupa PWA: dipasang dari browser tanpa Play Store. Bagikan link `https://<domain>/download` —
di Android/Chrome tombolnya langsung memasang aplikasi, di iPhone muncul panduan "Tambah ke Layar Utama".

> Paket Hobby Vercel hanya untuk penggunaan non-komersial. Saat mulai berbayar, pindah ke Vercel Pro atau Cloudflare Pages (build statis yang sama).

## Skrip

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Typecheck + build produksi ke `dist/` |
| `npm test` | Tes unit (ongkir, format) + tes SQL di Postgres WASM (PGlite) |
| `npm run icons` | Buat ulang ikon PWA di `public/` |

## Keamanan singkat

- Harga, ongkir, dan total **dihitung ulang di server** (`place_order`). Angka di HP hanya tampilan.
- Pesanan hanya bisa dibuat/diubah lewat fungsi RPC; RLS mencegah pembeli melihat pesanan orang lain.
- Pembeli maks. 3 pesanan "menunggu" per toko. Pelacakan lintas perangkat memakai token rahasia di link.

## Belum termasuk (tahap berikutnya)

Sinkron offline penuh untuk penjual (IndexedDB + antrean), impor Excel, jam buka per hari, laporan, backup JSON, jelajah toko terdekat, web push saat aplikasi tertutup, captcha anti-bot, QRIS.
