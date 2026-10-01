import { useCallback, useEffect, useState } from 'react';
import { toAppError } from './errors';
import { cacheCatalog, getCachedCatalog } from './local';
import { supabase } from './supabase';
import type { Catalog } from './types';

interface State {
  catalog: Catalog | null;
  loading: boolean;
  /** true bila data dari cache karena offline / gagal memuat */
  stale: boolean;
  cachedAt: number | null;
  notFound: boolean;
  error: string | null;
}

export async function fetchCatalog(slug: string): Promise<Catalog | null> {
  const { data, error } = await supabase.rpc('get_store_catalog', { p_slug: slug });
  if (error) throw error;
  return (data as Catalog | null) ?? null;
}

/** Katalog toko: ambil dari server, simpan cache; pakai cache bila offline. */
export function useCatalog(slug: string) {
  const [state, setState] = useState<State>(() => {
    const c = getCachedCatalog(slug);
    return { catalog: c?.catalog ?? null, loading: true, stale: !!c, cachedAt: c?.at ?? null, notFound: false, error: null };
  });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const c = await fetchCatalog(slug);
      if (!c) {
        setState({ catalog: null, loading: false, stale: false, cachedAt: null, notFound: true, error: null });
        return null;
      }
      cacheCatalog(c);
      setState({ catalog: c, loading: false, stale: false, cachedAt: Date.now(), notFound: false, error: null });
      return c;
    } catch (e) {
      const cached = getCachedCatalog(slug);
      setState({
        catalog: cached?.catalog ?? null,
        loading: false,
        stale: !!cached,
        cachedAt: cached?.at ?? null,
        notFound: false,
        error: toAppError(e).message,
      });
      return cached?.catalog ?? null;
    }
  }, [slug]);

  useEffect(() => {
    load();
    const onOnline = () => load();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [load]);

  return { ...state, reload: load };
}
