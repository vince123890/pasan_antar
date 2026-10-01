// Menguji migrasi Supabase di Postgres asli (PGlite/WASM) dengan stub skema auth & storage.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import vectors from './fee-vectors.json';

const STUB = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select auth.jwt() ->> 'role' $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
create publication supabase_realtime;
grant usage on schema public, auth, storage to anon, authenticated;
`;

const GRANTS = `
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
`;

const SELLER = '11111111-1111-1111-1111-111111111111';
const SELLER2 = '22222222-2222-2222-2222-222222222222';
const BUYER = '33333333-3333-3333-3333-333333333333';
const BUYER2 = '44444444-4444-4444-4444-444444444444';

let db: PGlite;

async function as(user: string | null, opts: { anonymous?: boolean } = {}) {
  await db.exec('reset role');
  if (user === null) {
    await db.exec(`set request.jwt.claims = ''; set role anon;`);
  } else {
    const claims = JSON.stringify({ sub: user, role: 'authenticated', is_anonymous: !!opts.anonymous });
    await db.exec(`set request.jwt.claims = '${claims}'; set role authenticated;`);
  }
}

async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await db.query<T>(sql, params)).rows;
}

async function expectError(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toThrow(code);
}

let storeId = '';
let p1 = '';
let p2 = '';

const placeArgs = (over: Record<string, unknown> = {}) => {
  const a = {
    store: storeId, ref: crypto.randomUUID(), items: JSON.stringify([{ product_id: p1, qty: 2 }]),
    ful: 'delivery', pay: 'cod', name: 'Dimas', phone: '6281234567890', addr: 'Jl. Mawar 1',
    lat: -6.2, lng: 106.8 + 3 / 111.32 / Math.cos((-6.2 * Math.PI) / 180), note: null, total: 20000,
    ...over,
  };
  return [a.store, a.ref, a.items, a.ful, a.pay, a.name, a.phone, a.addr, a.lat, a.lng, a.note, a.total];
};
const PLACE = 'select * from place_order($1,$2,$3::jsonb,$4::fulfillment_type,$5::payment_method,$6,$7,$8,$9,$10,$11,$12)';

beforeAll(async () => {
  db = new PGlite();
  await db.exec(STUB);
  await db.exec(readFileSync(new URL('../supabase/migrations/0001_init.sql', import.meta.url), 'utf8'));
  await db.exec(readFileSync(new URL('../supabase/migrations/0002_payment.sql', import.meta.url), 'utf8'));
  await db.exec(GRANTS);
  await db.exec(`insert into auth.users values ('${SELLER}'),('${SELLER2}'),('${BUYER}'),('${BUYER2}')`);

  await as(SELLER);
  const [s] = await q<{ id: string }>(
    `insert into stores (slug, name, category_code, wa_phone, lat, lng)
     values ('warung-bu-sri', 'Warung Bu Sri', 'warung_kelontong', '6281111111111', -6.2, 106.8) returning id`);
  storeId = s.id;
  await q(`select save_delivery_settings($1, '{"road_factor": 1.3}'::jsonb, $2::jsonb)`, [storeId, JSON.stringify([
    { from_km: 0, to_km: 5, fee_type: 'free' },
    { from_km: 5, to_km: 10, fee_type: 'flat', amount: 1000 },
    { from_km: 10, to_km: 15, fee_type: 'per_km', amount: 2000 },
  ])]);
  [{ id: p1 }] = await q(`insert into products (store_id, name, price) values ($1, 'Indomie', 10000) returning id`, [storeId]);
  [{ id: p2 }] = await q(`insert into products (store_id, name, price, is_available) values ($1, 'Telur', 2000, false) returning id`, [storeId]);
});

describe('ongkir (calc_delivery_fee)', () => {
  for (const v of vectors) {
    it(v.name, async () => {
      await as(BUYER, { anonymous: true });
      // geser ke timur sejauh straight_km di lintang toko
      const lng = 106.8 + v.straight_km / (6371 * (Math.PI / 180) * Math.cos((-6.2 * Math.PI) / 180));
      const [r] = await q(`select * from calc_delivery_fee($1, -6.2, $2, $3)`, [storeId, lng, 0]);
      expect(Number(r.distance_km)).toBeCloseTo(v.expected.distance_km, 1);
      expect(r.in_coverage).toBe(v.expected.in_coverage);
      if (v.expected.in_coverage) expect(r.fee).toBe(v.expected.fee);
    });
  }
});

describe('RLS', () => {
  it('pembeli anonim tidak bisa membuat toko', async () => {
    await as(BUYER, { anonymous: true });
    await expectError(q(`insert into stores (slug, name, category_code, wa_phone, lat, lng)
      values ('toko-palsu', 'Palsu', 'lainnya', '6281111111112', -6.2, 106.8)`), 'row-level security');
  });

  it('penjual lain tidak bisa mengubah produk toko orang', async () => {
    await as(SELLER2);
    const rows = await q(`update products set price = 1 where id = $1 returning id`, [p1]);
    expect(rows).toHaveLength(0);
  });

  it('penjual tidak bisa mengubah plan / owner', async () => {
    await as(SELLER);
    await q(`update stores set plan = 'premium', owner_id = $2 where id = $1`, [storeId, SELLER2]);
    const [s] = await q(`select plan, owner_id from stores where id = $1`, [storeId]);
    expect(s.plan).toBe('free');
    expect(s.owner_id).toBe(SELLER);
  });

  it('tidak ada yang bisa insert orders langsung', async () => {
    await as(BUYER, { anonymous: true });
    await expectError(q(`insert into orders (store_id, buyer_id, client_ref, fulfillment, buyer_name, buyer_phone)
      values ($1, $2, gen_random_uuid(), 'pickup', 'x', '6281')`, [storeId, BUYER]), 'row-level security');
  });

  it('pengunjung tanpa login bisa melihat katalog', async () => {
    await as(null);
    const [{ c }] = await q(`select get_store_catalog('warung-bu-sri') as c`);
    expect(c.store.name).toBe('Warung Bu Sri');
    expect(c.store.owner_id).toBeUndefined();
    expect(c.tiers).toHaveLength(3);
    expect(c.products).toHaveLength(2);
  });
});

describe('place_order', () => {
  it('membuat pesanan dengan harga & ongkir dari server', async () => {
    await as(BUYER, { anonymous: true });
    // 3 km garis lurus × 1.3 = 3.9 km → gratis
    const [o] = await q(PLACE, placeArgs());
    expect(o.subtotal).toBe(20000);
    expect(o.delivery_fee).toBe(0);
    expect(o.total).toBe(20000);
    expect(o.status).toBe('pending');
    const items = await q(`select * from order_items where order_id = $1`, [o.id]);
    expect(items[0].line_total).toBe(20000);
  });

  it('idempoten untuk client_ref yang sama', async () => {
    await as(BUYER, { anonymous: true });
    const ref = crypto.randomUUID();
    const [a] = await q(PLACE, placeArgs({ ref }));
    const [b] = await q(PLACE, placeArgs({ ref }));
    expect(a.id).toBe(b.id);
  });

  it('menolak total yang tidak cocok (PRICE_CHANGED) tanpa menyisakan data', async () => {
    await as(SELLER);
    const [before] = await q(`select count(*)::int c from orders`);
    await as(BUYER2, { anonymous: true });
    await expectError(q(PLACE, placeArgs({ total: 15000 })), 'PRICE_CHANGED');
    await as(SELLER);
    const [after] = await q(`select count(*)::int c from orders`);
    expect(after.c).toBe(before.c);
  });

  it('menolak produk habis', async () => {
    await as(BUYER2, { anonymous: true });
    await expectError(q(PLACE, placeArgs({ items: JSON.stringify([{ product_id: p2, qty: 1 }]) })), 'PRODUCT_UNAVAILABLE');
  });

  it('menolak di luar jangkauan', async () => {
    await as(BUYER2, { anonymous: true });
    await expectError(q(PLACE, placeArgs({ lng: 106.95 })), 'OUT_OF_COVERAGE');
  });

  it('ambil sendiri tanpa lokasi, ongkir 0', async () => {
    await as(BUYER2, { anonymous: true });
    const [o] = await q(PLACE, placeArgs({ ful: 'pickup', lat: null, lng: null, addr: null }));
    expect(o.delivery_fee).toBe(0);
    expect(o.distance_km).toBeNull();
  });

  it('maks 3 pesanan pending per pembeli per toko', async () => {
    await as(BUYER2, { anonymous: true });
    await q(PLACE, placeArgs());
    await q(PLACE, placeArgs()); // sekarang BUYER2 punya 3 pending (1 pickup + 2 ini)
    await expectError(q(PLACE, placeArgs()), 'TOO_MANY_PENDING');
  });

  it('pembeli hanya melihat pesanannya sendiri', async () => {
    await as(BUYER, { anonymous: true });
    const mine = await q(`select buyer_id from orders`);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every(r => r.buyer_id === BUYER)).toBe(true);
    await as(SELLER2);
    expect(await q(`select id from orders`)).toHaveLength(0);
  });

  it('menolak saat toko tutup', async () => {
    await as(SELLER);
    await q(`update stores set is_open = false where id = $1`, [storeId]);
    await as(BUYER, { anonymous: true });
    await expectError(q(PLACE, placeArgs()), 'STORE_CLOSED');
    await as(SELLER);
    await q(`update stores set is_open = true where id = $1`, [storeId]);
  });
});

describe('update_order_status', () => {
  let orderId = '';
  beforeAll(async () => {
    await as(SELLER);
    await q(`update stores set min_order = null where id = $1`, [storeId]);
    await as('55555555-5555-5555-5555-555555555555', { anonymous: true }).catch(() => {});
    await db.exec(`reset role; insert into auth.users values ('55555555-5555-5555-5555-555555555555')`);
    await as('55555555-5555-5555-5555-555555555555', { anonymous: true });
    [{ id: orderId }] = await q(PLACE, placeArgs());
  });

  it('pembeli tidak bisa menerima pesanan', async () => {
    await expectError(q(`select update_order_status($1, 'pending', 'accepted')`, [orderId]), 'INVALID_TRANSITION');
  });

  it('tolak wajib alasan', async () => {
    await as(SELLER);
    await expectError(q(`select update_order_status($1, 'pending', 'rejected')`, [orderId]), 'REASON_REQUIRED');
  });

  it('alur penjual: terima → siapkan → antar → selesai', async () => {
    await as(SELLER);
    for (const [from, to] of [['pending', 'accepted'], ['accepted', 'preparing'], ['preparing', 'delivering'], ['delivering', 'completed']]) {
      const [o] = await q(`select * from update_order_status($1, $2::order_status, $3::order_status)`, [orderId, from, to]);
      expect(o.status).toBe(to);
    }
    const ev = await q(`select to_status from order_events where order_id = $1 order by id`, [orderId]);
    expect(ev.map(e => e.to_status)).toEqual(['pending', 'accepted', 'preparing', 'delivering', 'completed']);
  });

  it('STATUS_CONFLICT bila status sudah berubah', async () => {
    await as(SELLER);
    await expectError(q(`select update_order_status($1, 'pending', 'accepted')`, [orderId]), 'STATUS_CONFLICT');
  });

  it('pesanan ambil sendiri tidak bisa "delivering"', async () => {
    await as(BUYER, { anonymous: true });
    const [o] = await q(PLACE, placeArgs({ ful: 'pickup', lat: null, lng: null, addr: null }));
    await as(SELLER);
    await q(`select update_order_status($1, 'pending', 'accepted')`, [o.id]);
    await expectError(q(`select update_order_status($1, 'accepted', 'delivering')`, [o.id]), 'INVALID_TRANSITION');
  });

  it('lacak via token tanpa membocorkan data pribadi', async () => {
    await as(null);
    await db.exec('reset role'); // token lookup dipanggil oleh anon
    const [{ track_token }] = await q(`select track_token from orders where id = $1`, [orderId]);
    await as(null);
    const [{ r }] = await q(`select get_order_by_token($1, $2) as r`, [orderId, track_token]);
    expect(r.order.status).toBe('completed');
    expect(r.order.buyer_phone).toBeUndefined();
    expect(r.items).toHaveLength(1);
    const [{ r: bad }] = await q(`select get_order_by_token($1, 'salah') as r`, [orderId]);
    expect(bad).toBeNull();
  });
});

describe('save_delivery_settings', () => {
  it('menolak tier berlubang', async () => {
    await as(SELLER);
    await expectError(q(`select save_delivery_settings($1, '{}'::jsonb, $2::jsonb)`, [storeId, JSON.stringify([
      { from_km: 0, to_km: 5, fee_type: 'free' }, { from_km: 6, to_km: 10, fee_type: 'flat', amount: 1000 },
    ])]), 'INVALID_TIERS');
  });

  it('hanya pemilik', async () => {
    await as(SELLER2);
    await expectError(q(`select save_delivery_settings($1, '{}'::jsonb, '[]'::jsonb)`, [storeId]), 'FORBIDDEN');
  });
});

describe('pembayaran (status saja; bukti & nota di HP via WA)', () => {
  const BUYER3 = '66666666-6666-6666-6666-666666666666';

  beforeAll(async () => {
    await db.exec('reset role');
    await db.exec(`insert into auth.users values ('${BUYER3}')`);
    await as(SELLER);
    await q(`update stores set bank_info = 'BCA 123 a.n. Sri' where id = $1`, [storeId]);
  });

  it('alur transfer: menunggu cek → ditolak → kirim ulang → lunas', async () => {
    await as(BUYER3, { anonymous: true });
    const [o] = await q(PLACE, placeArgs({ pay: 'transfer' }));
    expect(o.payment_status).toBe('pending_verification');

    await expectError(q(`select confirm_payment($1, true)`, [o.id]), 'FORBIDDEN');

    await as(SELLER);
    await expectError(q(`select confirm_payment($1, false)`, [o.id]), 'REASON_REQUIRED');
    const [rej] = await q(`select * from confirm_payment($1, false, 'Nominal kurang')`, [o.id]);
    expect(rej.payment_status).toBe('rejected');
    expect(rej.payment_note).toBe('Nominal kurang');

    await as(BUYER2, { anonymous: true });
    await expectError(q(`select resubmit_payment($1)`, [o.id]), 'FORBIDDEN');
    await as(BUYER3, { anonymous: true });
    const [re] = await q(`select * from resubmit_payment($1)`, [o.id]);
    expect(re.payment_status).toBe('pending_verification');

    await as(SELLER);
    const [paid] = await q(`select * from confirm_payment($1, true)`, [o.id]);
    expect(paid.payment_status).toBe('paid');
    expect(paid.paid_at).not.toBeNull();
    await expectError(q(`select confirm_payment($1, true)`, [o.id]), 'ALREADY_PAID');

    await db.exec('reset role');
    const [{ track_token }] = await q(`select track_token from orders where id = $1`, [o.id]);
    await as(null);
    const [{ r }] = await q(`select get_order_by_token($1, $2) as r`, [o.id, track_token]);
    expect(r.order.payment_status).toBe('paid');
    expect(r.order.buyer_phone).toBeUndefined();
    expect(r.store).toHaveProperty('address');
  });

  it('COD: mulai belum dibayar, penjual tandai lunas', async () => {
    await as(BUYER3, { anonymous: true });
    const [o] = await q(PLACE, placeArgs({ ful: 'pickup', lat: null, lng: null, addr: null }));
    expect(o.payment_status).toBe('unpaid');
    await as(SELLER);
    await expectError(q(`select confirm_payment($1, false, 'x')`, [o.id]), 'INVALID_TRANSITION');
    const [paid] = await q(`select * from confirm_payment($1)`, [o.id]);
    expect(paid.payment_status).toBe('paid');
  });
});
