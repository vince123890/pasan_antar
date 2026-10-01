import { createClient, type Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

export const supabase = createClient(url || 'http://localhost:54321', key || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const isAnonymous = (s: Session | null) => Boolean(s?.user?.is_anonymous);

/** undefined = masih memuat */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

export interface AuthProviders {
  google: boolean;
  email: boolean;
  anonymous: boolean;
}

let providersPromise: Promise<AuthProviders | null> | null = null;

/** Provider login yang aktif di Supabase (Authentication → Providers). null bila gagal dicek. */
export function fetchAuthProviders(): Promise<AuthProviders | null> {
  providersPromise ??= fetch(`${url}/auth/v1/settings`, { headers: { apikey: key ?? '' } })
    .then(r => (r.ok ? r.json() : null))
    .then((s: { external?: Record<string, boolean> } | null) =>
      s?.external
        ? { google: !!s.external.google, email: !!s.external.email, anonymous: !!s.external.anonymous_users }
        : null)
    .catch(() => {
      providersPromise = null; // coba lagi lain kali (mis. sedang offline)
      return null;
    });
  return providersPromise;
}

/** undefined = masih memuat, null = tidak bisa dicek */
export function useAuthProviders(): AuthProviders | null | undefined {
  const [p, setP] = useState<AuthProviders | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fetchAuthProviders().then(v => alive && setP(v));
    return () => { alive = false; };
  }, []);
  return p;
}

/** Pembeli tidak perlu daftar: buat sesi anonim bila belum ada. */
export async function ensureBuyerSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const res = await supabase.auth.signInAnonymously();
  if (res.error || !res.data.user) throw res.error ?? new Error('Gagal membuat sesi');
  return res.data.user.id;
}
