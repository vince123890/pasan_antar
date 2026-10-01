-- =====================================================================
-- Pesan Antar — status pembayaran & konfirmasi penjual
-- Jalankan SETELAH 0001_init.sql (Supabase SQL Editor → Run).
--
-- Bukti transfer & nota TIDAK disimpan di server: disimpan di HP (local storage)
-- dan dikirim lewat WhatsApp. Server hanya mencatat status pembayaran.
-- =====================================================================

create type payment_status as enum ('unpaid', 'pending_verification', 'paid', 'rejected');

alter table orders
  add column payment_status payment_status not null default 'unpaid',
  add column paid_at        timestamptz,
  add column payment_note   text;

-- Transfer: pembeli melampirkan bukti di HP-nya → status langsung "menunggu dicek penjual"
create function set_initial_payment_status() returns trigger language plpgsql as $$
begin
  new.payment_status := case when new.payment_method = 'transfer' then 'pending_verification' else 'unpaid' end;
  new.paid_at := null;
  new.payment_note := null;
  return new;
end $$;

create trigger t_orders_payment_init before insert on orders
  for each row execute function set_initial_payment_status();

-- ---------- Penjual: konfirmasi pembayaran (COD diterima / transfer diverifikasi) ----------
create function confirm_payment(p_order_id uuid, p_accept boolean default true, p_note text default null)
returns orders language plpgsql security definer set search_path = public as $$
declare
  o orders;
begin
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if not is_store_owner(o.store_id) then raise exception 'FORBIDDEN'; end if;
  if o.status in ('rejected', 'cancelled') then raise exception 'INVALID_TRANSITION'; end if;
  if o.payment_status = 'paid' then raise exception 'ALREADY_PAID'; end if;

  if p_accept then
    update orders set payment_status = 'paid', paid_at = now(), payment_note = null
     where id = o.id returning * into o;
  else
    if o.payment_method <> 'transfer' or o.payment_status <> 'pending_verification' then
      raise exception 'INVALID_TRANSITION';
    end if;
    if coalesce(trim(p_note), '') = '' then raise exception 'REASON_REQUIRED'; end if;
    update orders set payment_status = 'rejected', payment_note = trim(p_note)
     where id = o.id returning * into o;
  end if;
  return o;
end $$;

-- ---------- Pembeli: sudah mengirim bukti transfer baru lewat WA ----------
create function resubmit_payment(p_order_id uuid)
returns orders language plpgsql security definer set search_path = public as $$
declare
  o orders;
begin
  select * into o from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.buyer_id is distinct from auth.uid() then raise exception 'FORBIDDEN'; end if;
  if o.payment_method <> 'transfer' or o.payment_status <> 'rejected' then
    raise exception 'INVALID_TRANSITION';
  end if;
  update orders set payment_status = 'pending_verification', payment_note = null
   where id = o.id returning * into o;
  return o;
end $$;

revoke execute on function confirm_payment(uuid, boolean, text) from public, anon;
grant  execute on function confirm_payment(uuid, boolean, text) to authenticated;
revoke execute on function resubmit_payment(uuid) from public, anon;
grant  execute on function resubmit_payment(uuid) to authenticated;

-- ---------- Lacak & nota: sertakan alamat & logo toko ----------
create or replace function get_order_by_token(p_order_id uuid, p_token text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order', to_jsonb(o) - 'buyer_id' - 'buyer_phone' - 'buyer_lat' - 'buyer_lng'
                         - 'client_ref' - 'track_token',
    'items', coalesce((select jsonb_agg(to_jsonb(i)) from order_items i where i.order_id = o.id), '[]'::jsonb),
    'store', jsonb_build_object('name', s.name, 'slug', s.slug, 'wa_phone', s.wa_phone,
                                'bank_info', s.bank_info, 'address', s.address, 'logo_url', s.logo_url)
  )
  from orders o join stores s on s.id = o.store_id
  where o.id = p_order_id and o.track_token = p_token;
$$;
