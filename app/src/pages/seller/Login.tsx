import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PageLoading, Spinner, toast } from '../../components/ui';
import { isAnonymous, supabase, useAuthProviders, useSession } from '../../lib/supabase';

export default function Login() {
  const session = useSession();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const providers = useAuthProviders();
  // Tampilkan Google hanya bila aktif di Supabase; bila status tidak bisa dicek (null), tetap tampilkan.
  const showGoogle = providers === null || providers?.google === true;

  if (session === undefined) return <PageLoading />;
  if (session && !isAnonymous(session)) return <Navigate to="/seller" replace />;

  const redirectTo = `${window.location.origin}/seller`;

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) toast(error.message, 'error');
  };

  const sendLink = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo } });
    setBusy(false);
    if (error) toast(error.message, 'error');
    else setSent(true);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <Link to="/" className="mb-8 text-sm text-stone-500">← Beranda</Link>
      <div className="mb-2 text-4xl">🛵</div>
      <h1 className="text-2xl font-bold">Masuk sebagai Penjual</h1>
      <p className="mt-1 text-sm text-stone-600">Buka toko online dan terima pesanan antar dari pelanggan sekitar. Gratis.</p>

      {showGoogle && (<>
      <button onClick={google} className="btn-secondary mt-8 w-full py-3">
        <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        Lanjut dengan Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-stone-400">
        <div className="h-px flex-1 bg-stone-200" /> atau <div className="h-px flex-1 bg-stone-200" />
      </div>
      </>)}
      {!showGoogle && <div className="mt-8" />}

      {sent ? (
        <div className="card p-4 text-sm">
          <p className="font-semibold">Cek email Anda 📧</p>
          <p className="mt-1 text-stone-600">Kami mengirim link masuk ke <b>{email}</b>. Buka link itu di HP/browser ini.</p>
          <button className="mt-3 text-sm font-semibold text-brand-600" onClick={() => setSent(false)}>Ganti email</button>
        </div>
      ) : (
        <form onSubmit={sendLink} className="space-y-3">
          <label className="label" htmlFor="email">Masuk dengan email</label>
          <input id="email" type="email" required className="input" placeholder="nama@email.com"
            value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} Kirim link masuk
          </button>
        </form>
      )}
    </div>
  );
}
