import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Empty, PageLoading, Sheet, Spinner, toast, Toggle } from '../../components/ui';
import { toAppError } from '../../lib/errors';
import { parseIntSafe, rupiah } from '../../lib/format';
import { uploadStoreImage } from '../../lib/media';
import { useSeller } from '../../lib/seller';
import { supabase } from '../../lib/supabase';
import type { Product, ProductCategory } from '../../lib/types';

const NONE = '__none__';

export default function Products() {
  const { store } = useSeller();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [cats, setCats] = useState<ProductCategory[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [catSheet, setCatSheet] = useState(false);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').eq('store_id', store.id).is('deleted_at', null).order('sort').order('name'),
      supabase.from('product_categories').select('*').eq('store_id', store.id).order('sort').order('name'),
    ]);
    if (p.error || c.error) {
      toast(toAppError(p.error ?? c.error).message, 'error');
      setProducts(prev => prev ?? []);
      return;
    }
    setProducts(p.data as Product[]);
    setCats(c.data as ProductCategory[]);
  }, [store.id]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter(p =>
      (filter === 'all' || (filter === NONE ? !p.category_id : p.category_id === filter)) &&
      (!q || p.name.toLowerCase().includes(q)));
  }, [products, filter, query]);

  const toggleAvailable = async (p: Product, v: boolean) => {
    setProducts(list => list?.map(x => (x.id === p.id ? { ...x, is_available: v } : x)) ?? null);
    const { error } = await supabase.from('products').update({ is_available: v }).eq('id', p.id);
    if (error) {
      toast(toAppError(error).message, 'error');
      load();
    }
  };

  if (!products) return <PageLoading />;
  const catName = (id: string | null) => cats.find(c => c.id === id)?.name;

  return (
    <div>
      <div className="space-y-3 p-4">
        <div className="flex gap-2">
          <input className="input" placeholder="Cari produk…" value={query} onChange={e => setQuery(e.target.value)} />
          <button className="btn-primary shrink-0" onClick={() => setEditing({ is_available: true, category_id: filter !== 'all' && filter !== NONE ? filter : null })}>
            + Produk
          </button>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button className={`chip ${filter === 'all' ? 'chip-active' : ''}`} onClick={() => setFilter('all')}>Semua ({products.length})</button>
          {cats.map(c => (
            <button key={c.id} className={`chip ${filter === c.id ? 'chip-active' : ''}`} onClick={() => setFilter(c.id)}>{c.name}</button>
          ))}
          {products.some(p => !p.category_id) && cats.length > 0 && (
            <button className={`chip ${filter === NONE ? 'chip-active' : ''}`} onClick={() => setFilter(NONE)}>Tanpa kategori</button>
          )}
          <button className="chip border-dashed text-brand-700" onClick={() => setCatSheet(true)}>⚙ Kategori</button>
        </div>
      </div>

      {visible.length === 0 ? (
        <Empty icon="📦" title={products.length ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}>
          {!products.length && 'Tambahkan produk pertama Anda. Foto boleh menyusul.'}
        </Empty>
      ) : (
        <ul className="divide-y divide-stone-100 border-y border-stone-200 bg-white">
          {visible.map(p => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEditing(p)}>
                {p.image_url
                  ? <img src={p.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
                  : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl">📦</div>}
                <div className="min-w-0">
                  <p className={`truncate font-medium ${p.is_available ? '' : 'text-stone-400 line-through'}`}>{p.name}</p>
                  <p className="text-sm font-semibold tabular-nums">{rupiah(p.price)}</p>
                  {catName(p.category_id) && <p className="text-xs text-stone-500">{catName(p.category_id)}</p>}
                </div>
              </button>
              <div className="flex flex-col items-center gap-1">
                <Toggle checked={p.is_available} onChange={v => toggleAvailable(p, v)} />
                <span className="text-[10px] text-stone-500">{p.is_available ? 'Tersedia' : 'Habis'}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProductSheet
          key={editing.id ?? 'new'}
          product={editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
      <CategorySheet open={catSheet} cats={cats} onClose={() => setCatSheet(false)} onChanged={load} />
    </div>
  );
}

function ProductSheet({ product, cats, onClose, onSaved }: {
  product: Partial<Product>; cats: ProductCategory[]; onClose: () => void; onSaved: () => void;
}) {
  const { store } = useSeller();
  const [name, setName] = useState(product.name ?? '');
  const [price, setPrice] = useState(product.price != null ? String(product.price) : '');
  const [categoryId, setCategoryId] = useState(product.category_id ?? '');
  const [description, setDescription] = useState(product.description ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(product.image_url ?? null);
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : imageUrl), [file, imageUrl]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const id = product.id ?? crypto.randomUUID();
      let image_url = imageUrl;
      if (file) image_url = await uploadStoreImage(store.id, file, `p-${id}`);
      const row = {
        id,
        store_id: store.id,
        name: name.trim(),
        price: parseIntSafe(price),
        category_id: categoryId || null,
        description: description.trim() || null,
        image_url,
        is_available: product.is_available ?? true,
      };
      const { error } = await supabase.from('products').upsert(row);
      if (error) throw error;
      toast('Produk disimpan', 'success');
      onSaved();
    } catch (err) {
      toast(toAppError(err).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!product.id || !confirm(`Hapus "${product.name}"?`)) return;
    setBusy(true);
    const { error } = await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', product.id);
    setBusy(false);
    if (error) return toast(toAppError(error).message, 'error');
    toast('Produk dihapus');
    onSaved();
  };

  return (
    <Sheet open onClose={onClose} title={product.id ? 'Ubah produk' : 'Tambah produk'}>
      <form onSubmit={save} className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-center text-xs text-stone-500">
            {preview ? <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span>📷<br />Foto</span>}
            <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="text-xs text-stone-500">
            Foto opsional. Otomatis diperkecil agar hemat kuota.
            {preview && (
              <button type="button" className="mt-1 block font-semibold text-red-600" onClick={() => { setFile(null); setImageUrl(null); }}>
                Hapus foto
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="pname">Nama produk</label>
          <input id="pname" className="input" required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="mis. Indomie Goreng" />
        </div>
        <div>
          <label className="label" htmlFor="pprice">Harga (Rp)</label>
          <input id="pprice" className="input" required inputMode="numeric" value={price}
            onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ''))} placeholder="3500" />
          {price && <p className="hint">{rupiah(parseIntSafe(price))}</p>}
        </div>
        <div>
          <label className="label" htmlFor="pcat">Kategori</label>
          <select id="pcat" className="input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">Tanpa kategori</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pdesc">Deskripsi (opsional)</label>
          <textarea id="pdesc" className="input" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="flex gap-2 pt-2">
          {product.id && <button type="button" className="btn-danger" onClick={remove} disabled={busy}>Hapus</button>}
          <button className="btn-primary flex-1 py-3" disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Simpan</button>
        </div>
      </form>
    </Sheet>
  );
}

function CategorySheet({ open, cats, onClose, onChanged }: {
  open: boolean; cats: ProductCategory[]; onClose: () => void; onChanged: () => void;
}) {
  const { store } = useSeller();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await supabase.from('product_categories')
      .insert({ store_id: store.id, name: name.trim(), sort: cats.length });
    setBusy(false);
    if (error) return toast(toAppError(error).message, 'error');
    setName('');
    onChanged();
  };

  const rename = async (c: ProductCategory) => {
    const n = prompt('Nama kategori', c.name)?.trim();
    if (!n || n === c.name) return;
    const { error } = await supabase.from('product_categories').update({ name: n }).eq('id', c.id);
    if (error) return toast(toAppError(error).message, 'error');
    onChanged();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= cats.length) return;
    const a = cats[idx];
    const b = cats[j];
    await Promise.all([
      supabase.from('product_categories').update({ sort: j }).eq('id', a.id),
      supabase.from('product_categories').update({ sort: idx }).eq('id', b.id),
    ]);
    onChanged();
  };

  const remove = async (c: ProductCategory) => {
    if (!confirm(`Hapus kategori "${c.name}"? Produknya tetap ada (jadi tanpa kategori).`)) return;
    const { error } = await supabase.from('product_categories').delete().eq('id', c.id);
    if (error) return toast(toAppError(error).message, 'error');
    onChanged();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Kategori produk">
      <form onSubmit={add} className="flex gap-2">
        <input className="input" placeholder="mis. Minuman, Sembako, Rokok" maxLength={40} value={name} onChange={e => setName(e.target.value)} />
        <button className="btn-primary shrink-0" disabled={busy || !name.trim()}>Tambah</button>
      </form>
      {cats.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-500">Belum ada kategori.</p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100">
          {cats.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2 py-2">
              <span className="flex-1 font-medium">{c.name}</span>
              <button className="btn-ghost !px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naik">↑</button>
              <button className="btn-ghost !px-2" onClick={() => move(i, 1)} disabled={i === cats.length - 1} aria-label="Turun">↓</button>
              <button className="btn-ghost !px-2" onClick={() => rename(c)}>Ubah</button>
              <button className="btn-ghost !px-2 text-red-600" onClick={() => remove(c)}>Hapus</button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
