-- ============================================================
-- AJIN · Cerebro interno (búsqueda semántica + chat)
--
-- Ejecutar en el SQL Editor DESPUÉS de supabase-arriendos.sql.
-- Antes de ejecutarlo, haz un respaldo (Supabase → Database → Backups).
--
-- Este script SOLO crea objetos nuevos y siembra permisos:
--   * no borra tablas ni filas existentes
--   * `if not exists` y `on conflict do nothing` permiten ejecutarlo varias veces
--   * no toca `properties`, `leases` ni `audit_log`
--
-- Requiere la extensión pgvector (Supabase la trae disponible).
-- ============================================================

set search_path = public, extensions;

-- ------------------------------------------------------------
-- 1) Extensión pgvector
-- ------------------------------------------------------------
create extension if not exists vector with schema extensions;

-- ------------------------------------------------------------
-- 2) Documentos y fragmentos vectorizados
-- ------------------------------------------------------------
-- Cada documento es una unidad de negocio (un inmueble, un contrato,
-- un mes, un artículo del blog, una página del sitio...). Se parte en
-- fragmentos (`knowledge_chunks`) que guardan el embedding de 1536
-- dimensiones (OpenAI text-embedding-3-small o Gemini gemini-embedding-001
-- con outputDimensionality=1536).
create table if not exists public.knowledge_documents (
  id bigserial primary key,
  source_type text not null,
  source_id text not null,
  locale text not null default '',
  title text not null default '',
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  content_hash text not null,
  embedded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, source_id, locale)
);

create index if not exists knowledge_documents_source_idx
  on public.knowledge_documents (source_type, source_id);

create table if not exists public.knowledge_chunks (
  id bigserial primary key,
  document_id bigint not null references public.knowledge_documents(id) on delete cascade,
  chunk_index int not null default 0,
  content text not null,
  -- Búsqueda por palabra clave (híbrida con la vectorial): nombres, cédulas,
  -- montos e identificadores exactos no siempre aparecen con cosine similarity.
  search_text tsvector generated always as (to_tsvector('simple', content)) stored,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists knowledge_chunks_document_idx
  on public.knowledge_chunks (document_id);
create index if not exists knowledge_chunks_search_idx
  on public.knowledge_chunks using gin (search_text);
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- ------------------------------------------------------------
-- 3) Caché semántico de respuestas
-- ------------------------------------------------------------
-- Guarda pregunta + respuesta + fuentes. Solo se reutiliza si la nueva
-- pregunta es casi idéntica (similitud >= AI_CACHE_THRESHOLD, por defecto 0.97)
-- y la entrada no ha expirado. El índice se invalida completo cuando cambia
-- algún documento.
create table if not exists public.knowledge_cache (
  id bigserial primary key,
  question text not null,
  answer text not null,
  sources jsonb not null default '[]'::jsonb,
  locale text not null default '',
  embedding vector(1536) not null,
  hits int not null default 0,
  created_at timestamptz not null default now(),
  last_hit_at timestamptz,
  expires_at timestamptz not null
);

create index if not exists knowledge_cache_embedding_idx
  on public.knowledge_cache using hnsw (embedding vector_cosine_ops);
create index if not exists knowledge_cache_expiry_idx
  on public.knowledge_cache (expires_at);

-- ------------------------------------------------------------
-- 4) Historial de sincronizaciones
-- ------------------------------------------------------------
create table if not exists public.knowledge_sync_runs (
  id bigserial primary key,
  actor_email text not null default '',
  mode text not null default 'incremental',
  documents int not null default 0,
  chunks int not null default 0,
  embedded int not null default 0,
  skipped int not null default 0,
  removed int not null default 0,
  duration_ms int not null default 0,
  error text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5) Seguridad: solo la service-role key (rutas /api/admin/* y cron)
-- ------------------------------------------------------------
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.knowledge_cache enable row level security;
alter table public.knowledge_sync_runs enable row level security;
-- Sin políticas públicas: el anon key no puede leer el cerebro.

grant select, insert, update, delete on public.knowledge_documents to service_role;
grant select, insert, update, delete on public.knowledge_chunks to service_role;
grant select, insert, update, delete on public.knowledge_cache to service_role;
grant select, insert, update, delete on public.knowledge_sync_runs to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ------------------------------------------------------------
-- 6) Búsqueda híbrida (vector + palabra clave)
-- ------------------------------------------------------------
create or replace function public.match_knowledge(
  query_embedding vector(1536),
  query_text text,
  match_count int default 8,
  min_similarity double precision default 0.15
)
returns table (
  chunk_id bigint,
  document_id bigint,
  source_type text,
  source_id text,
  locale text,
  title text,
  content text,
  metadata jsonb,
  similarity double precision,
  score double precision
)
language sql
stable
set search_path = public, extensions
as $$
  with scored as (
    select
      c.id as chunk_id,
      c.document_id,
      d.source_type,
      d.source_id,
      d.locale,
      d.title,
      c.content,
      d.metadata,
      (1 - (c.embedding <=> query_embedding))::double precision as similarity,
      case
        when coalesce(btrim(query_text), '') = '' then 0::double precision
        else ts_rank(c.search_text, websearch_to_tsquery('simple', query_text))::double precision
      end as keyword_rank
    from public.knowledge_chunks c
    join public.knowledge_documents d on d.id = c.document_id
  )
  select
    chunk_id,
    document_id,
    source_type,
    source_id,
    locale,
    title,
    content,
    metadata,
    similarity,
    (0.75 * similarity + 0.25 * least(keyword_rank, 1.0))::double precision as score
  from scored
  where similarity >= min_similarity
  order by score desc
  limit greatest(1, least(coalesce(match_count, 8), 50));
$$;

-- ------------------------------------------------------------
-- 7) Búsqueda en el caché semántico
-- ------------------------------------------------------------
create or replace function public.match_knowledge_cache(
  query_embedding vector(1536),
  cache_locale text,
  min_similarity double precision default 0.97
)
returns table (
  id bigint,
  answer text,
  sources jsonb,
  similarity double precision
)
language sql
stable
set search_path = public, extensions
as $$
  with scored as (
    select
      k.id,
      k.answer,
      k.sources,
      (1 - (k.embedding <=> query_embedding))::double precision as similarity
    from public.knowledge_cache k
    where k.expires_at > now()
      and k.locale = coalesce(cache_locale, '')
  )
  select id, answer, sources, similarity
  from scored
  where similarity >= min_similarity
  order by similarity desc
  limit 1;
$$;

-- ------------------------------------------------------------
-- 8) Permisos nuevos
-- ------------------------------------------------------------
-- admin: usar el chat y actualizar el índice.
-- gestor: usar el chat (el admin puede quitarle el permiso desde /admin/roles).
insert into public.role_permissions (role, permission) values
  ('admin',  'knowledge.view'),
  ('admin',  'knowledge.manage'),
  ('gestor', 'knowledge.view')
on conflict do nothing;
