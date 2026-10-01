import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Empty, OfflineBanner, PageLoading, Sheet, StoreAvatar } from '../../components/ui';
import { useCatalog } from '../../lib/catalog';
import { formatDateTime, rupiah, waLink } from '../../lib/format';
import { describeTier, maxCoverageKm, sortTiers } from '../../lib/geo';
import { setQty, useCart } from '../../lib/local';
import type { Catalog, Product } from '../../lib/types';

export default function StorePage() {
  const { slug = '' } = useParams();
  const { catalog, loading, notFound, stale, cachedAt, error } = useCatalog(slug);

  if (!catalog && loading) return <PageLoading />;
  if (notFound || !catalog) {
    return (
      <div className="mx-auto max-w-lg pt-16">
        <Empty icon="🏚️" title={notFound ? 'Toko tidak ditemukan' : 'Gagal memuat toko'}>
          {notFound ? 'Periksa kembali link-nya.' : error}
          <div className="mt-4"><Link to="/" className="btn-secondary">Ke beranda</Link></div>
        </Empty>
      </div>
    );
  }
  return <StoreView catalog={catalog} stale={stale} cachedAt={cachedAt} />;
}

function StoreView({ catalog, stale, cachedAt }: { catalog: Catalog; stale: boolean; cachedAt: number | null }) {
  const { store, tiers, categories, products } = catalog;
  const cart = useCart(store.id);
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);

  const byId = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const cartLines = cart.filter(l => byId.get(l.product_id)?.is_available);
  const cartCount = cartLines.reduce((s, l) => s + l.qty, 0);
  const cartTotal = cartLines.reduce((s, l) => s + l.qty * (byId.get(l.product_id)?.price ?? 0), 0);
  const qtyOf = (id: string) => cart.find(l => l.product_id === id)?.qty ?? 0;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (p: Product) => !q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const list = [
      ...categories.map(c => ({ id: c.id, name: c.name, items: products.filter(p => p.category_id === c.id && match(p)) })),
      { id: 'none', name: categories.length ? 'Lainnya' : 'Semua produk', items: products.filter(p => !p.category_id && match(p)) },
    ].filter(s => s.items.length > 0);
    return activeCat === 'all' ? list : list.filter(s => s.id === activeCat);
  }, [categories, products, query, activeCat]);

  const maxKm = maxCoverageKm(tiers);
  const firstTier = sortTiers(tiers)[0];

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-white pb-28">
      <OfflineBanner />
      {stale && cachedAt && (
        <p className="bg-amber-50 px-4 py-2 text-center text-xs text-amber-800">Menampilkan data tersimpan per {formatDateTime(new Date(cachedAt).toISOString())}</p>
      )}

      <header className="border-b border-stone-100 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-stone-500">← Beranda</Link>
          <Link to="/pesanan" className="text-sm font-medium text-brand-700">Pesanan saya</Link>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <StoreAvatar name={store.name} url={store.logo_url} size="h-16 w-16" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl leading-tight font-bold">{store.name}</h1>
            <p className={`mt-0.5 text-sm font-semibold ${store.is_open ? 'text-emerald-700' : 'text-red-600'}`}>
              {store.is_open ? '● Buka' : '● Tutup sekarang'}
            </p>
          </div>
        </div>
        {store.description && <p className="mt-2 text-sm text-stone-600">{store.description}</p>}
        <button onClick={() => setInfoOpen(true)} className="mt-3 flex w-full items-center gap-2 rounded-xl bg-stone-50 px-3 py-2 text-left text-sm">
          <span>🛵</span>
          <span className="flex-1 text-stone-700">
            {store.delivery_enabled
              ? <>Antar s/d <b>{maxKm} km</b>{firstTier && <> • {firstTier.to_km} km pertama {describeTier(firstTier).toLowerCase()}</>}</>
              : 'Hanya ambil sendiri'}
          </span>
          <span className="text-xs font-semibold text-brand-700">Info</span>
        </button>
      </header>

      {!store.is_open && (
        <p className="mx-4 mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">Toko sedang tutup. Anda bisa melihat menu, tapi belum bisa memesan.</p>
      )}

      <div className="sticky top-0 z-10 space-y-2 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur">
        <input className="input !py-2" placeholder={`Cari di ${store.name}…`} value={query} onChange={e => setQuery(e.target.value)} />
        {categories.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
            <button className={`chip ${activeCat === 'all' ? 'chip-active' : ''}`} onClick={() => setActiveCat('all')}>Semua</button>
            {categories.map(c => (
              <button key={c.id} className={`chip ${activeCat === c.id ? 'chip-active' : ''}`} onClick={() => setActiveCat(c.id)}>{c.name}</button>
            ))}
          </div>
        )}
      </div>

      {sections.length === 0 ? (
        <Empty icon="🔍" title={products.length ? 'Produk tidak ditemukan' : 'Toko belum punya produk'} />
      ) : (
        sections.map(s => (
          <section key={s.id} className="px-4 pt-5">
            <h2 className="mb-1 text-lg font-bold">{s.name}</h2>
            <ul className="divide-y divide-stone-100">
              {s.items.map(p => (
                <ProductRow key={p.id} p={p} qty={qtyOf(p.id)} canOrder={store.is_open}
                  onQty={q => setQty(store.id, p.id, q)} />
              ))}
            </ul>
          </section>
        ))
      )}

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Link to={`/t/${store.slug}/checkout`}
            className={`btn-primary w-full justify-between rounded-2xl py-4 text-base shadow-xl ${store.is_open ? '' : 'pointer-events-none opacity-60'}`}>
            <span>{cartCount} item</span>
            <span>Lanjut • {rupiah(cartTotal)}</span>
          </Link>
        </div>
      )}

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title="Info toko">
        <div className="space-y-4 text-sm">
          {store.delivery_enabled && (
            <div>
              <p className="mb-2 font-semibold">Ongkir berdasarkan jarak</p>
              <table className="w-full">
                <tbody>
                  {sortTiers(tiers).map(t => (
                    <tr key={`${t.from_km}-${t.to_km}`} className="border-b border-stone-100">
                      <td className="py-2 text-stone-600">{t.from_km}–{t.to_km} km</td>
                      <td className="py-2 text-right font-semibold">{describeTier(t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {store.free_delivery_min_order && (
                <p className="mt-2 text-emerald-700">🎉 Gratis ongkir untuk belanja min. {rupiah(store.free_delivery_min_order)}</p>
              )}
            </div>
          )}
          {store.pickup_enabled && <p>🏪 Bisa ambil sendiri di toko (tanpa ongkir).</p>}
          {store.min_order && <p>Minimal belanja {rupiah(store.min_order)}.</p>}
          {store.address && <p className="text-stone-600">📍 {store.address}</p>}
          <a className="btn-wa w-full" href={waLink(store.wa_phone, `Halo ${store.name}, saya mau tanya…`)} target="_blank" rel="noreferrer">
            Chat penjual di WhatsApp
          </a>
        </div>
      </Sheet>
    </div>
  );
}

function ProductRow({ p, qty, canOrder, onQty }: { p: Product; qty: number; canOrder: boolean; onQty: (q: number) => void }) {
  return (
    <li className={`flex gap-3 py-3 ${p.is_available ? '' : 'opacity-50'}`}>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{p.name}</p>
        {p.description && <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{p.description}</p>}
        <p className="mt-1 font-semibold tabular-nums">{rupiah(p.price)}</p>
      </div>
      <div className="flex w-24 shrink-0 flex-col items-center gap-2">
        {p.image_url
          ? <img src={p.image_url} alt="" loading="lazy" className="h-20 w-20 rounded-xl object-cover" />
          : null}
        {!p.is_available ? (
          <span className="text-xs font-semibold text-stone-500">Habis</span>
        ) : qty === 0 ? (
          <button className="btn-secondary w-full !border-brand-600 !py-1.5 !text-brand-700" disabled={!canOrder} onClick={() => onQty(1)}>
            Tambah
          </button>
        ) : (
          <div className="flex w-full items-center justify-between rounded-xl border border-brand-600">
            <button className="h-8 w-8 text-lg font-bold text-brand-700" onClick={() => onQty(qty - 1)} aria-label="Kurangi">−</button>
            <span className="text-sm font-bold tabular-nums">{qty}</span>
            <button className="h-8 w-8 text-lg font-bold text-brand-700" onClick={() => onQty(qty + 1)} aria-label="Tambah">+</button>
          </div>
        )}
      </div>
    </li>
  );
}
