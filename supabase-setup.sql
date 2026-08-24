-- ============================================================
-- AJIN Marketplace de Inmuebles — Setup Supabase
-- Pegar en: Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Tabla de propiedades
create table if not exists public.properties (
  id bigint generated always as identity primary key,
  operation text not null check (operation in ('venta','arriendo')),
  type text not null default 'apartamento' check (type in ('apartamento','casa','oficina','lote','bodega')),
  title text not null,
  description text not null default '',
  price_cop bigint not null check (price_cop >= 0),
  area_m2 int,
  bedrooms int,
  bathrooms int,
  parking int,
  stratum int check (stratum between 1 and 6),
  neighborhood text not null default '',
  city text not null default 'Bogotá',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  featured boolean not null default false,
  owner_name text not null default '',
  owner_phone text not null default '',
  owner_email text not null default '',
  source text not null default 'admin' check (source in ('admin','client')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- 2. Tabla de fotos
create table if not exists public.property_images (
  id bigint generated always as identity primary key,
  property_id bigint not null references public.properties(id) on delete cascade,
  url text not null,
  path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_properties_operation on public.properties(operation, status);
create index if not exists idx_property_images_property on public.property_images(property_id);

-- 3. Row Level Security: el público solo lee lo aprobado.
--    TODAS las escrituras pasan por las rutas API del sitio usando la
--    service-role key (que ignora RLS), así que no se abren políticas de escritura.
alter table public.properties enable row level security;
alter table public.property_images enable row level security;

drop policy if exists "public read approved properties" on public.properties;
create policy "public read approved properties"
  on public.properties for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "public read property images" on public.property_images;
create policy "public read property images"
  on public.property_images for select
  to anon, authenticated
  using (true);

-- 4. Bucket público de imágenes (límite 5MB por archivo)
insert into storage.buckets (id, name, public, file_size_limit)
values ('inmuebles', 'inmuebles', true, 5242880)
on conflict (id) do update set public = true, file_size_limit = 5242880;

drop policy if exists "public read inmuebles" on storage.objects;
create policy "public read inmuebles"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'inmuebles');

-- ============================================================
-- 5. CREAR LOS USUARIOS ADMIN (3)
--    Dashboard → Authentication → Users → Add user
--    (email + password, marcar "Auto Confirm User")
--
--    Usar los mismos emails definidos en la variable ADMIN_EMAILS
--    del proyecto (.env.local / Vercel). No registrar emails reales
--    en este archivo: queda versionado en el repositorio.
--
--    El acceso al panel también exige que el email de sesión esté
--    incluido en ADMIN_EMAILS.
-- ============================================================
