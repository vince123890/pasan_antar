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

/** Pembeli tidak perlu daftar: buat sesi anonim bila belum ada. */
export async function ensureBuyerSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const res = await supabase.auth.signInAnonymously();
  if (res.error || !res.data.user) throw res.error ?? new Error('Gagal membuat sesi');
  return res.data.user.id;
}
