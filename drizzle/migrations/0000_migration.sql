create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('admin', 'collaborator');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.profiles to authenticated; grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;

create function public.is_member() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.user_roles where user_id = auth.uid()) $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin') $$;

create table public.settings (
  id boolean primary key default true check (id),
  his_name text not null default 'Luis',
  her_name text not null default 'Jeisy',
  started_at timestamptz,
  timezone text not null default 'America/Bogota',
  welcome_message text not null default 'Tengo algo que hice pensando en ti, Jeisy',
  reminder_phrase text default 'Entre millones de personas, qué bonito coincidir contigo.',
  surprise_message text default 'Gracias por existir y por elegirme cada día.',
  hero_photo_path text,
  song_url text,
  collaborator_can_edit boolean not null default true
);
insert into public.settings default values;
grant select, update on public.settings to authenticated; grant all on public.settings to service_role;

create function public.can_edit() returns boolean language sql stable security definer set search_path = public as
$$ select public.is_admin() or (public.is_member() and (select collaborator_can_edit from public.settings)) $$;

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  name text not null, cover_photo_id uuid,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
insert into public.albums (name) values ('Nuestros momentos'),('Sonrisas'),('Nuestras salidas'),('Pequeños instantes');

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  category text, visited_on date, description text, why_special text,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  title text not null, happened_on date not null, description text,
  category text, is_favorite boolean not null default false,
  place_id uuid references public.places(id) on delete set null,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create index on public.memories (happened_on);
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  title text, taken_on date, description text, tags text[] not null default '{}',
  is_favorite boolean not null default false,
  album_id uuid references public.albums(id) on delete set null,
  memory_id uuid references public.memories(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  alt_text text not null default 'Fotografía de Luis y Jeisy',
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create table public.letters (
  id uuid primary key default gen_random_uuid(),
  title text not null, written_on date not null default current_date, body text not null,
  photo_path text, is_special boolean not null default false,
  is_private boolean not null default false,
  unlock_at timestamptz,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create table public.love_notes (id uuid primary key default gen_random_uuid(), body text not null, created_by uuid default auth.uid(), created_at timestamptz default now());
create table public.special_dates (
  id uuid primary key default gen_random_uuid(),
  title text not null, on_date date not null, kind text, repeats_yearly boolean not null default false, notes text,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create table public.future_items (
  id uuid primary key default gen_random_uuid(),
  title text not null, notes text, photo_path text, done boolean not null default false, done_on date,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  role public.app_role not null default 'collaborator',
  expires_at timestamptz not null default now() + interval '7 days',
  revoked boolean not null default false,
  used_by uuid, used_at timestamptz,
  created_by uuid default auth.uid(), created_at timestamptz default now()
);

do $$ declare t text; begin
  foreach t in array array['albums','places','memories','photos','letters','love_notes','special_dates','future_items','invites'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
  foreach t in array array['profiles','user_roles','settings','albums','places','memories','photos','letters','love_notes','special_dates','future_items','invites'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
  foreach t in array array['albums','places','memories','photos','love_notes','special_dates','future_items'] loop
    execute format('create policy "%1$s_read" on public.%1$I for select to authenticated using (public.is_member())', t);
    execute format('create policy "%1$s_ins" on public.%1$I for insert to authenticated with check (public.can_edit())', t);
    execute format('create policy "%1$s_upd" on public.%1$I for update to authenticated using (public.can_edit()) with check (public.can_edit())', t);
    execute format('create policy "%1$s_del" on public.%1$I for delete to authenticated using (public.can_edit())', t);
  end loop;
end $$;

create policy settings_read on public.settings for select to authenticated using (public.is_member());
create policy settings_upd on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy profiles_read on public.profiles for select to authenticated using (public.is_member() or id = auth.uid());
create policy roles_read on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy letters_read on public.letters for select to authenticated using (
  public.is_admin() or (public.is_member() and (unlock_at is null or unlock_at <= now()) and not is_private)
);
create policy letters_ins on public.letters for insert to authenticated with check (public.can_edit());
create policy letters_upd on public.letters for update to authenticated using (public.is_admin() or created_by = auth.uid()) with check (public.can_edit());
create policy letters_del on public.letters for delete to authenticated using (public.is_admin() or created_by = auth.uid());

create policy invites_admin on public.invites for all to authenticated using (public.is_admin()) with check (public.is_admin());

create function public.claim_first_admin(p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  perform pg_advisory_xact_lock(42);
  if exists (select 1 from public.user_roles where role = 'admin') then
    raise exception 'Este espacio ya tiene administrador';
  end if;
  insert into public.profiles (id, display_name) values (auth.uid(), p_name)
    on conflict (id) do update set display_name = excluded.display_name;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin');
end $$;

create function public.has_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.user_roles where role = 'admin') $$;

create function public.redeem_invite(p_token text, p_name text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare inv public.invites;
begin
  if auth.uid() is null then raise exception 'Debes iniciar sesión'; end if;
  select * into inv from public.invites
   where token_hash = encode(extensions.digest(p_token,'sha256'),'hex')
     and not revoked and used_by is null and expires_at > now() for update;
  if not found then raise exception 'Invitación inválida o caducada'; end if;
  insert into public.profiles (id, display_name) values (auth.uid(), p_name)
    on conflict (id) do update set display_name = excluded.display_name;
  insert into public.user_roles (user_id, role) values (auth.uid(), inv.role) on conflict do nothing;
  update public.invites set used_by = auth.uid(), used_at = now() where id = inv.id;
end $$;

create function public.create_invite(p_role public.app_role default 'collaborator') returns text
language plpgsql security definer set search_path = public, extensions as $$
declare tok text;
begin
  if not public.is_admin() then raise exception 'Solo el administrador'; end if;
  tok := encode(extensions.gen_random_bytes(24),'hex');
  insert into public.invites (token_hash, role) values (encode(extensions.digest(tok,'sha256'),'hex'), p_role);
  return tok;
end $$;

create function public.remove_member(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo el administrador'; end if;
  if p_user = auth.uid() then raise exception 'No puedes eliminarte a ti mismo'; end if;
  delete from public.user_roles where user_id = p_user;
end $$;

revoke execute on function public.claim_first_admin(text), public.redeem_invite(text,text), public.create_invite(public.app_role), public.remove_member(uuid), public.has_admin() from public, anon;
grant execute on function public.claim_first_admin(text), public.redeem_invite(text,text), public.create_invite(public.app_role), public.remove_member(uuid), public.has_admin() to authenticated;

create policy media_read on storage.objects for select to authenticated using (bucket_id='media' and public.is_member());
create policy media_ins on storage.objects for insert to authenticated with check (bucket_id='media' and public.can_edit());
create policy media_upd on storage.objects for update to authenticated using (bucket_id='media' and public.can_edit());
create policy media_del on storage.objects for delete to authenticated using (bucket_id='media' and public.can_edit());