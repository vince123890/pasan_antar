-- =====================================================================
-- Pesan Antar — skema MVP (slim)
-- Jalankan sekali di Supabase SQL Editor (atau `supabase db push`).
-- =====================================================================

-- ---------- Tipe ----------
create type fee_type         as enum ('free', 'flat', 'per_km');
create type fulfillment_type as enum ('delivery', 'pickup');
create type payment_method   as enum ('cod', 'transfer');
create type order_status     as enum ('pending', 'accepted', 'preparing', 'delivering',
                                      'ready_pickup', 'completed', 'rejected', 'cancelled');

-- ---------- Tabel ----------
create table store_categories (
  code  text primary key,
  label text not null,
  icon  text,
  sort  int  not null default 0
);

create table stores (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid not null default auth.uid() references auth.users on delete cascade,
  slug                    text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  name                    text not null check (length(name) between 2 and 80),
  category_code           text not null references store_categories(code),
  description             text,
  logo_url                text,
  wa_phone                text not null check (wa_phone ~ '^62[0-9]{8,13}$'),
  address                 text,
  lat                     float8 not null check (lat between -11 and 6),
  lng                     float8 not null check (lng between 94 and 142),
  is_open                 boolean not null default true,
  delivery_enabled        boolean not null default true,
  pickup_enabled          boolean not null default true,
  road_factor             numeric(3,2) not null default 1.30 check (road_factor between 1 and 2),
  free_delivery_min_order int check (free_delivery_min_order > 0),
  min_order               int check (min_order > 0),
  bank_info               text,                 -- info transfer, mis. "BCA 123456 a.n. Sri"
  plan                    text not null default 'free',
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index stores_owner_idx on stores (owner_id);

create table delivery_tiers (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references stores on delete cascade,
  from_km    numeric(4,1) not null check (from_km >= 0),
  to_km      numeric(4,1) not null check (to_km <= 50),
  fee_type   fee_type not null,
  amount     int not null default 0 check (amount >= 0),
  check (to_km > from_km)
);
create index delivery_tiers_store_idx on delivery_tiers (store_id, from_km);

create table product_categories (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references stores on delete cascade,
  name       text not null check (length(name) between 1 and 40),
  sort       int not null default 0,
  created_at timestamptz not null default now()
);
create index product_categories_store_idx on product_categories (store_id);

create table products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores on delete cascade,
  category_id  uuid references product_categories on delete set null,
  name         text not null check (length(name) between 1 and 120),
  description  text,
  price        int  not null check (price >= 0),
  image_url    text,
  is_available boolean not null default true,
  sort         int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index products_store_idx on products (store_id) where deleted_at is null;

create table orders (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique default ('PA-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  store_id       uuid not null references stores on delete cascade,
  buyer_id       uuid not null references auth.users,
  client_ref     uuid not null,
  track_token    text not null default md5(gen_random_uuid()::text),
  status         order_status not null default 'pending',
  fulfillment    fulfillment_type not null,
  payment_method payment_method not null default 'cod',
  buyer_name     text not null,
  buyer_phone    text not null,
  address        text,
  buyer_lat      float8,
  buyer_lng      float8,
  distance_km    numeric(5,1),
  subtotal       int not null default 0,
  delivery_fee   int not null default 0,
  total          int not null default 0,
  note           text,
  reject_reason  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (buyer_id, client_ref)
);
create index orders_store_idx on orders (store_id, created_at desc);
create index orders_buyer_idx on orders (buyer_id, created_at desc);

create table order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders on delete cascade,
  product_id uuid references products on delete set null,
  name       text not null,
  price      int  not null,
  qty        int  not null check (qty between 1 and 99),
  note       text,
  line_total int generated always as (price * qty) stored
);
create index order_items_order_idx on order_items (order_id);

create table order_events (
  id          bigserial primary key,
  order_id    uuid not null references orders on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  actor_id    uuid,
  reason      text,
  created_at  timestamptz not null default now()
);
create index order_events_order_idx on order_events (order_id);

-- ---------- Trigger ----------
create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger t_stores_touch   before update on stores   for each row execute function touch_updated_at();
create trigger t_products_touch before update on products for each row execute function touch_updated_at();
create trigger t_orders_touch   before update on orders   for each row execute function touch_updated_at();

-- Penjual tidak boleh mengubah kolom milik platform
create function protect_store_columns() returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.is_active := true;
      new.owner_id := auth.uid();
    else
      new.plan := old.plan;
      new.is_active := old.is_active;
      new.owner_id := old.owner_id;
    end if;
  end if;
  return new;
end $$;
create trigger t_stores_protect before insert or update on stores
  for each row execute function protect_store_columns();

-- ---------- Helper ----------
create function is_store_owner(p_store_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from stores where id = p_store_id and owner_id = auth.uid());
$$;

create function is_real_user() returns boolean language sql stable as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false;
$$;

-- ---------- RLS ----------
alter table store_categories   enable row level security;
alter table stores             enable row level security;
alter table delivery_tiers     enable row level security;
alter table product_categories enable row level security;
alter table products           enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table order_events       enable row level security;

create policy "kategori toko publik" on store_categories for select using (true);

create policy "toko publik"       on stores for select using (is_active or owner_id = auth.uid());
create policy "penjual buat toko" on stores for insert with check (is_real_user() and owner_id = auth.uid());
create policy "penjual ubah toko" on stores for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "tier publik"  on delivery_tiers for select using (true);
-- tier hanya diubah lewat RPC save_delivery_settings

create policy "kategori produk publik"  on product_categories for select using (true);
create policy "kategori produk pemilik" on product_categories for all
  using (is_store_owner(store_id)) with check (is_store_owner(store_id));

create policy "produk publik"  on products for select using (deleted_at is null or is_store_owner(store_id));
create policy "produk pemilik" on products for all
  using (is_store_owner(store_id)) with check (is_store_owner(store_id));

-- orders: tidak ada policy insert/update → hanya lewat RPC
create policy "pesanan terlihat" on orders for select
  using (buyer_id = auth.uid() or is_store_owner(store_id));
create policy "item terlihat" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id
                 and (o.buyer_id = auth.uid() or is_store_owner(o.store_id))));
create policy "event terlihat" on order_events for select
  using (exists (select 1 from orders o where o.id = order_id
                 and (o.buyer_id = auth.uid() or is_store_owner(o.store_id))));

-- ---------- Ongkir ----------
create function haversine_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

create function calc_delivery_fee(p_store_id uuid, p_lat float8, p_lng float8, p_subtotal int)
returns table (distance_km numeric, fee int, in_coverage boolean)
language plpgsql stable set search_path = public as $$
declare
  s stores;
  t delivery_tiers;
  d numeric;
begin
  select * into s from stores where id = p_store_id;
  d := round((haversine_km(s.lat, s.lng, p_lat, p_lng) * s.road_factor)::numeric, 1);

  select * into t from delivery_tiers dt
   where dt.store_id = p_store_id
     and ((d > dt.from_km and d <= dt.to_km) or (d = 0 and dt.from_km = 0))
   order by dt.from_km
   limit 1;

  if not found then
    return query select d, 0, false;
    return;
  end if;

  if s.free_delivery_min_order is not null and p_subtotal >= s.free_delivery_min_order then
    return query select d, 0, true;
    return;
  end if;

  return query select d,
    case t.fee_type
      when 'free'   then 0
      when 'flat'   then t.amount
      when 'per_km' then (ceil(d) * t.amount)::int
    end,
    true;
end $$;

-- Simpan pengaturan antar + tier secara atomik
create function save_delivery_settings(p_store_id uuid, p_settings jsonb, p_tiers jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  r      jsonb;
  prev   numeric := 0;
  n      int := 0;
begin
  if not is_store_owner(p_store_id) then raise exception 'FORBIDDEN'; end if;

  -- validasi tier (harus berurutan, mulai 0, tanpa lubang)
  for r in select value from jsonb_array_elements(p_tiers) order by (value ->> 'from_km')::numeric loop
    n := n + 1;
    if (r ->> 'from_km')::numeric <> prev then raise exception 'INVALID_TIERS'; end if;
    if (r ->> 'to_km')::numeric <= prev or (r ->> 'to_km')::numeric > 50 then raise exception 'INVALID_TIERS'; end if;
    if (r ->> 'fee_type') <> 'free' and coalesce((r ->> 'amount')::int, 0) <= 0 then raise exception 'INVALID_TIERS'; end if;
    prev := (r ->> 'to_km')::numeric;
  end loop;
  if n > 10 then raise exception 'INVALID_TIERS'; end if;
  if n = 0 and coalesce((p_settings ->> 'delivery_enabled')::boolean, true) then
    raise exception 'INVALID_TIERS';
  end if;

  update stores set
    delivery_enabled        = coalesce((p_settings ->> 'delivery_enabled')::boolean, delivery_enabled),
    pickup_enabled          = coalesce((p_settings ->> 'pickup_enabled')::boolean, pickup_enabled),
    road_factor             = coalesce((p_settings ->> 'road_factor')::numeric, road_factor),
    free_delivery_min_order = nullif((p_settings ->> 'free_delivery_min_order')::int, 0),
    min_order               = nullif((p_settings ->> 'min_order')::int, 0)
  where id = p_store_id;

  delete from delivery_tiers where store_id = p_store_id;
  insert into delivery_tiers (store_id, from_km, to_km, fee_type, amount)
  select p_store_id, (value ->> 'from_km')::numeric, (value ->> 'to_km')::numeric,
         (value ->> 'fee_type')::fee_type,
         case when value ->> 'fee_type' = 'free' then 0 else (value ->> 'amount')::int end
    from jsonb_array_elements(p_tiers);
end $$;

-- ---------- Katalog publik ----------
create function get_store_catalog(p_slug text) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'store', to_jsonb(s) - 'owner_id' - 'plan',
    'tiers', coalesce((select jsonb_agg(to_jsonb(t) order by t.from_km)
                         from delivery_tiers t where t.store_id = s.id), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(to_jsonb(c) order by c.sort, c.name)
                              from product_categories c where c.store_id = s.id), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(to_jsonb(p) order by p.sort, p.name)
                            from products p where p.store_id = s.id and p.deleted_at is null), '[]'::jsonb)
  )
  from stores s
  where s.slug = p_slug and s.is_active;
$$;

-- ---------- Pesanan ----------
create function can_transition(p_from order_status, p_to order_status,
                               p_fulfillment fulfillment_type, p_actor text)
returns boolean language sql immutable as $$
  select case p_actor
    when 'seller' then
      (p_from, p_to) in (
        ('pending'::order_status, 'accepted'::order_status),
        ('pending', 'rejected'), ('accepted', 'rejected'),
        ('accepted', 'preparing'),
        ('accepted', 'delivering'), ('preparing', 'delivering'),
        ('accepted', 'ready_pickup'), ('preparing', 'ready_pickup'),
        ('delivering', 'completed'), ('ready_pickup', 'completed'))
      and not (p_to = 'delivering'   and p_fulfillment = 'pickup')
      and not (p_to = 'ready_pickup' and p_fulfillment = 'delivery')
    when 'buyer' then p_from = 'pending' and p_to = 'cancelled'
    else false
  end;
$$;

create function place_order(
  p_store_id uuid, p_client_ref uuid, p_items jsonb,
  p_fulfillment fulfillment_type, p_payment payment_method,
  p_buyer_name text, p_buyer_phone text, p_address text,
  p_lat float8, p_lng float8, p_note text,
  p_expected_total int
) returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_uid      uuid := auth.uid();
  v_store    stores;
  v_order    orders;
  v_item     jsonb;
  v_product  products;
  v_qty      int;
  v_subtotal int := 0;
  v_dist     numeric;
  v_fee      int := 0;
  v_cover    boolean;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  -- idempoten: kiriman ulang dengan client_ref sama → kembalikan pesanan lama
  select * into v_order from orders where buyer_id = v_uid and client_ref = p_client_ref;
  if found then return v_order; end if;

  select * into v_store from stores where id = p_store_id and is_active;
  if not found then raise exception 'STORE_NOT_FOUND'; end if;
  if not v_store.is_open then raise exception 'STORE_CLOSED'; end if;

  if (select count(*) from orders
       where store_id = p_store_id and buyer_id = v_uid and status = 'pending') >= 3 then
    raise exception 'TOO_MANY_PENDING';
  end if;
  if p_buyer_phone !~ '^62[0-9]{8,13}$' or length(trim(coalesce(p_buyer_name, ''))) < 2 then
    raise exception 'INVALID_BUYER';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'INVALID_CART';
  end if;
  if p_payment = 'transfer' and v_store.bank_info is null then
    raise exception 'PAYMENT_UNAVAILABLE';
  end if;

  insert into orders (store_id, buyer_id, client_ref, fulfillment, payment_method,
                      buyer_name, buyer_phone, address, buyer_lat, buyer_lng, note)
  values (p_store_id, v_uid, p_client_ref, p_fulfillment, p_payment,
          trim(p_buyer_name), p_buyer_phone, nullif(trim(p_address), ''),
          p_lat, p_lng, nullif(trim(p_note), ''))
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'qty')::int;
    if v_qty is null or v_qty not between 1 and 99 then raise exception 'INVALID_QTY'; end if;

    select * into v_product from products
     where id = (v_item ->> 'product_id')::uuid
       and store_id = p_store_id and deleted_at is null;
    if not found or not v_product.is_available then
      raise exception 'PRODUCT_UNAVAILABLE' using detail = coalesce(v_item ->> 'product_id', '');
    end if;

    insert into order_items (order_id, product_id, name, price, qty, note)
    values (v_order.id, v_product.id, v_product.name, v_product.price, v_qty,
            nullif(trim(v_item ->> 'note'), ''));
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  if v_store.min_order is not null and v_subtotal < v_store.min_order then
    raise exception 'BELOW_MIN_ORDER' using detail = v_store.min_order::text;
  end if;

  if p_fulfillment = 'delivery' then
    if not v_store.delivery_enabled then raise exception 'DELIVERY_DISABLED'; end if;
    if p_lat is null or p_lng is null or coalesce(trim(p_address), '') = '' then
      raise exception 'LOCATION_REQUIRED';
    end if;
    select f.distance_km, f.fee, f.in_coverage into v_dist, v_fee, v_cover
      from calc_delivery_fee(p_store_id, p_lat, p_lng, v_subtotal) f;
    if not v_cover then raise exception 'OUT_OF_COVERAGE' using detail = v_dist::text; end if;
  else
    if not v_store.pickup_enabled then raise exception 'PICKUP_DISABLED'; end if;
    v_dist := null;
    v_fee := 0;
  end if;

  update orders
     set subtotal = v_subtotal, delivery_fee = v_fee, distance_km = v_dist,
         total = v_subtotal + v_fee
   where id = v_order.id
   returning * into v_order;

  if p_expected_total is distinct from v_order.total then
    raise exception 'PRICE_CHANGED' using detail = v_order.total::text;
  end if;

  insert into order_events (order_id, to_status, actor_id) values (v_order.id, 'pending', v_uid);
  return v_order;
end $$;

create function update_order_status(p_order_id uuid, p_from order_status, p_to order_status,
                                    p_reason text default null)
returns orders language plpgsql security definer set search_path = public as $$
declare
  o       orders;
  v_actor text;
begin
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  v_actor := case
    when is_store_owner(o.store_id) then 'seller'
    when o.buyer_id = auth.uid()    then 'buyer'
  end;
  if v_actor is null then raise exception 'FORBIDDEN'; end if;
  if o.status <> p_from then raise exception 'STATUS_CONFLICT' using detail = o.status::text; end if;
  if not can_transition(o.status, p_to, o.fulfillment, v_actor) then
    raise exception 'INVALID_TRANSITION';
  end if;
  if p_to = 'rejected' and coalesce(trim(p_reason), '') = '' then
    raise exception 'REASON_REQUIRED';
  end if;

  update orders
     set status = p_to,
         reject_reason = case when p_to = 'rejected' then trim(p_reason) else reject_reason end
   where id = p_order_id
   returning * into o;

  insert into order_events (order_id, from_status, to_status, actor_id, reason)
  values (o.id, p_from, p_to, auth.uid(), nullif(trim(p_reason), ''));
  return o;
end $$;

-- Lacak pesanan dari perangkat lain (pakai token), tanpa data pribadi pembeli
create function get_order_by_token(p_order_id uuid, p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order', to_jsonb(o) - 'buyer_id' - 'buyer_phone' - 'buyer_lat' - 'buyer_lng'
                         - 'client_ref' - 'track_token',
    'items', coalesce((select jsonb_agg(to_jsonb(i)) from order_items i where i.order_id = o.id), '[]'::jsonb),
    'store', jsonb_build_object('name', s.name, 'slug', s.slug, 'wa_phone', s.wa_phone, 'bank_info', s.bank_info)
  )
  from orders o join stores s on s.id = o.store_id
  where o.id = p_order_id and o.track_token = p_token;
$$;

revoke execute on function place_order(uuid, uuid, jsonb, fulfillment_type, payment_method,
  text, text, text, float8, float8, text, int) from public, anon;
grant  execute on function place_order(uuid, uuid, jsonb, fulfillment_type, payment_method,
  text, text, text, float8, float8, text, int) to authenticated;
revoke execute on function update_order_status(uuid, order_status, order_status, text) from public, anon;
grant  execute on function update_order_status(uuid, order_status, order_status, text) to authenticated;
revoke execute on function save_delivery_settings(uuid, jsonb, jsonb) from public, anon;
grant  execute on function save_delivery_settings(uuid, jsonb, jsonb) to authenticated;

-- ---------- Realtime ----------
alter publication supabase_realtime add table orders;

-- ---------- Storage (foto produk & logo) ----------
insert into storage.buckets (id, name, public)
values ('public-images', 'public-images', true)
on conflict (id) do nothing;

create policy "unggah gambar toko sendiri" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-images' and is_store_owner(((storage.foldername(name))[1])::uuid));
create policy "ubah gambar toko sendiri" on storage.objects for update to authenticated
  using (bucket_id = 'public-images' and is_store_owner(((storage.foldername(name))[1])::uuid));
create policy "hapus gambar toko sendiri" on storage.objects for delete to authenticated
  using (bucket_id = 'public-images' and is_store_owner(((storage.foldername(name))[1])::uuid));

-- ---------- Data awal ----------
insert into store_categories (code, label, icon, sort) values
  ('warung_kelontong', 'Warung / Toko Kelontong',         '🏪', 1),
  ('warung_makan',     'Warung Makan',                    '🍛', 2),
  ('minuman',          'Kopi & Minuman',                  '☕', 3),
  ('angkringan',       'Angkringan / Kaki Lima',          '🍢', 4),
  ('kue_jajanan',      'Kue & Jajanan',                   '🍰', 5),
  ('sayur_buah',       'Sayur, Buah & Sembako Segar',     '🥬', 6),
  ('material',         'Toko Bangunan / Material',        '🧱', 7),
  ('kesehatan',        'Kesehatan & Kebutuhan Bayi',      '💊', 8),
  ('lainnya',          'Lainnya',                         '🛍️', 99)
on conflict (code) do nothing;
