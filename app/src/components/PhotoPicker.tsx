import { useEffect, useMemo, useRef } from 'react';

/**
 * Pilih foto dari kamera (langsung membuka kamera belakang) atau galeri.
 * `capture` hanya berlaku di HP; di komputer keduanya membuka pemilih file.
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
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : existingUrl ?? null), [file, existingUrl]);
  useEffect(() => () => { if (file && preview) URL.revokeObjectURL(preview); }, [file, preview]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onPick(f);
    e.target.value = '';
  };

  return (
    <div className="flex items-start gap-4">
      <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-stone-50 text-center text-xs text-stone-500 ${
        aspect === 'portrait' ? 'h-32 w-24' : 'h-24 w-24'} ${required && !preview ? 'border-brand-300' : 'border-stone-300'}`}>
        {preview ? <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span>{label}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <button type="button" className="btn-secondary !justify-start" onClick={() => camRef.current?.click()}>
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
    </div>
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
