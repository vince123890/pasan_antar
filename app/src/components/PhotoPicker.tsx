import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from './ui';

/**
 * Pilih foto dari kamera atau galeri.
 * Kamera dibuka DI DALAM aplikasi (getUserMedia), karena banyak browser Android
 * (Samsung Internet, PWA terpasang, Photo Picker Android 13+) mengabaikan atribut
 * `capture` dan malah membuka galeri. Bila kamera tidak bisa dipakai, jatuh ke
 * input file dengan `capture`.
 */
export function PhotoPicker({ file, existingUrl, onPick, onClear, label = 'Foto', aspect = 'square', required = false }: {
  file: File | null;
  existingUrl?: string | null;
  onPick: (f: File) => void;
  onClear?: () => void;
  label?: string;
  aspect?: 'square' | 'portrait';
  required?: boolean;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : existingUrl ?? null), [file, existingUrl]);
  useEffect(() => () => { if (file && preview) URL.revokeObjectURL(preview); }, [file, preview]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onPick(f);
    e.target.value = '';
  };

  const openCamera = () => {
    if (typeof navigator.mediaDevices?.getUserMedia === 'function') setCameraOpen(true);
    else camRef.current?.click();
  };

  return (
    <div className="flex items-start gap-4">
      <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-stone-50 text-center text-xs text-stone-500 ${
        aspect === 'portrait' ? 'h-32 w-24' : 'h-24 w-24'} ${required && !preview ? 'border-brand-300' : 'border-stone-300'}`}>
        {preview ? <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span>{label}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <button type="button" className="btn-secondary !justify-start" onClick={openCamera}>
          <CameraIcon /> Ambil dari kamera
        </button>
        <button type="button" className="btn-ghost !justify-start border border-stone-200" onClick={() => galRef.current?.click()}>
          <GalleryIcon /> Pilih dari galeri
        </button>
        {preview && onClear && (
          <button type="button" className="text-left text-xs font-semibold text-red-600" onClick={onClear}>Hapus foto</button>
        )}
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      <input ref={galRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      {cameraOpen && (
        <CameraModal
          onClose={() => setCameraOpen(false)}
          onCapture={f => { setCameraOpen(false); onPick(f); }}
          onUnavailable={() => { setCameraOpen(false); camRef.current?.click(); }}
        />
      )}
    </div>
  );
}

/** Kamera layar penuh di dalam aplikasi: jepret, ganti kamera depan/belakang, batal. */
function CameraModal({ onClose, onCapture, onUnavailable }: {
  onClose: () => void;
  onCapture: (f: File) => void;
  onUnavailable: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const [canSwitch, setCanSwitch] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    stop();
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          v.play().catch(() => {}); // status "siap" diambil dari event onPlaying
        }
        navigator.mediaDevices.enumerateDevices()
          .then(d => setCanSwitch(d.filter(x => x.kind === 'videoinput').length > 1))
          .catch(() => {});
      })
      .catch((e: DOMException) => {
        if (cancelled) return;
        if (e.name === 'NotAllowedError') {
          toast('Izin kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser.', 'error');
          onClose();
        } else {
          onUnavailable(); // tidak ada kamera / tidak didukung → pakai kamera bawaan HP
        }
      });
    return () => { cancelled = true; };
  }, [facing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { stop(); document.body.style.overflow = ''; };
  }, [stop]);

  const shoot = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const g = canvas.getContext('2d');
    if (!g) return;
    if (facing === 'user') { g.translate(canvas.width, 0); g.scale(-1, 1); } // kamera depan: hasil tidak terbalik
    g.drawImage(v, 0, 0);
    setFlash(true);
    navigator.vibrate?.(30);
    canvas.toBlob(blob => {
      if (!blob) return toast('Gagal mengambil foto', 'error');
      stop();
      onCapture(new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onPlaying={() => setReady(true)}
          className={`h-full w-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`}
        />
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Membuka kamera…</div>}
        <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-200 ${flash ? 'opacity-80' : 'opacity-0'}`} />
      </div>
      <div className="flex items-center justify-between bg-black px-8 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <button type="button" onClick={() => { stop(); onClose(); }} className="w-16 text-sm font-semibold text-white">Batal</button>
        <button
          type="button"
          onClick={shoot}
          disabled={!ready}
          aria-label="Ambil foto"
          className="h-18 w-18 rounded-full border-4 border-white bg-white/90 transition active:scale-90 disabled:opacity-40"
          style={{ width: 72, height: 72 }}
        />
        <button
          type="button"
          onClick={() => setFacing(f => (f === 'environment' ? 'user' : 'environment'))}
          className={`w-16 text-sm font-semibold text-white ${canSwitch ? '' : 'invisible'}`}
        >
          Putar
        </button>
      </div>
    </div>,
    document.body,
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" />
    </svg>
  );
}
