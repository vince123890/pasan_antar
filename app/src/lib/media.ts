import { supabase } from './supabase';

/** Perkecil foto di HP sebelum upload (maks. 800px, WebP/JPEG ±80 KB) agar hemat kuota & storage. */
export async function compressImage(file: File, maxSize = 800): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak didukung');
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const toBlob = (type: string, q: number) =>
    new Promise<Blob | null>(r => canvas.toBlob(r, type, q));
  const webp = await toBlob('image/webp', 0.78);
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await toBlob('image/jpeg', 0.8);
  if (!jpeg) throw new Error('Gagal memproses gambar');
  return jpeg;
}

/** Foto → data URL terkompresi untuk disimpan di HP (local storage), tidak diunggah ke server. */
export async function fileToDataUrl(file: File, maxSize = 1000): Promise<string> {
  const blob = await compressImage(file, maxSize);
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export const dataUrlToBlob = (dataUrl: string) => fetch(dataUrl).then(r => r.blob());

/** Upload ke bucket public-images/{storeId}/... dan kembalikan URL publik. */
export async function uploadStoreImage(storeId: string, file: File, name: string): Promise<string> {
  const blob = await compressImage(file);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${storeId}/${name}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('public-images')
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  if (error) throw error;
  return supabase.storage.from('public-images').getPublicUrl(path).data.publicUrl;
}

// ---------- Bunyi & notifikasi pesanan baru ----------
let audioCtx: AudioContext | null = null;

/** Harus dipanggil dari aksi pengguna (klik) karena kebijakan autoplay browser. */
export async function unlockAudio(): Promise<boolean> {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    return audioCtx.state === 'running';
  } catch {
    return false;
  }
}

export const audioReady = () => audioCtx?.state === 'running';

export function playNewOrderSound() {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const t0 = audioCtx.currentTime;
  [0, 0.18, 0.36, 0.9, 1.08, 1.26].forEach((offset, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = i % 3 === 2 ? 1320 : 880;
    gain.gain.setValueAtTime(0.0001, t0 + offset);
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.16);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(t0 + offset);
    osc.stop(t0 + offset + 0.17);
  });
  navigator.vibrate?.([200, 100, 200]);
}

export function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      new Notification(title, { body, icon: '/icon-192.png', tag: 'new-order' });
    }
  } catch { /* beberapa browser HP hanya mengizinkan via service worker */ }
}
