// "Download aplikasi" = memasang PWA ke layar utama HP / desktop.
// Event beforeinstallprompt harus ditangkap sedini mungkin (modul ini di-import di main.tsx).
import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'android' | 'desktop';

let deferred: BeforeInstallPromptEvent | null = null;
let installed = isStandalone();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/i.test(ua) || iPadOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

/** Di iOS hanya Safari yang bisa "Tambah ke Layar Utama" (iOS 16.4+ juga Chrome/Edge). */
export const isIosNonSafari = () => detectPlatform() === 'ios' && /CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);

interface InstallState {
  /** Browser mendukung tombol install langsung (Chrome/Edge/Samsung Internet) */
  canPrompt: boolean;
  /** Sedang dibuka sebagai aplikasi terpasang */
  installed: boolean;
}

let snapshot: InstallState = { canPrompt: !!deferred, installed };
const getSnapshot = () => {
  if (snapshot.canPrompt !== !!deferred || snapshot.installed !== installed) {
    snapshot = { canPrompt: !!deferred, installed };
  }
  return snapshot;
};

export function useInstall(): InstallState {
  return useSyncExternalStore(
    l => { listeners.add(l); return () => listeners.delete(l); },
    getSnapshot,
    getSnapshot,
  );
}

/** true bila pengguna menerima. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const ev = deferred;
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  deferred = null;
  emit();
  return outcome === 'accepted';
}
