import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface KnowledgeDocMeta {
  id: number;
  source_type: string;
  source_id: string;
  locale: string;
  content_hash: string;
  embedded_at: string | null;
}

export interface KnowledgeDocRow {
  source_type: string;
  source_id: string;
  locale: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  content_hash: string;
  embedded_at: string | null;
  updated_at: string;
}

export interface KnowledgeChunkRow {
  document_id: number;
  chunk_index: number;
  content: string;
  embedding: number[];
}

function errorMessage(error: { message?: string; code?: string } | null): string | null {
  if (!error) return null;
  return error.code ? `${error.code}: ${error.message ?? ''}` : error.message ?? 'Error desconocido';
}

export async function listKnowledgeDocMeta(): Promise<{
  rows: KnowledgeDocMeta[];
  error: string | null;
}> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { rows: [], error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('id, source_type, source_id, locale, content_hash, embedded_at');
  return { rows: (data ?? []) as KnowledgeDocMeta[], error: errorMessage(error) };
}

export async function upsertKnowledgeDocs(
  rows: KnowledgeDocRow[]
): Promise<{ rows: KnowledgeDocMeta[]; error: string | null }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { rows: [], error: 'Supabase no configurado' };
  if (rows.length === 0) return { rows: [], error: null };

  const { data, error } = await supabase
    .from('knowledge_documents')
    .upsert(rows, { onConflict: 'source_type,source_id,locale' })
    .select('id, source_type, source_id, locale, content_hash, embedded_at');
  return { rows: (data ?? []) as KnowledgeDocMeta[], error: errorMessage(error) };
}

export async function replaceKnowledgeChunks(
  documentIds: number[],
  chunks: KnowledgeChunkRow[]
): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 'Supabase no configurado';
  if (documentIds.length === 0) return null;

  const { error: deleteError } = await supabase
    .from('knowledge_chunks')
    .delete()
    .in('document_id', documentIds);
  if (deleteError) return errorMessage(deleteError);

  for (let start = 0; start < chunks.length; start += 100) {
    const batch = chunks.slice(start, start + 100);
    const { error } = await supabase.from('knowledge_chunks').insert(batch);
    if (error) return errorMessage(error);
  }
  return null;
}

export async function markDocumentsEmbedded(ids: number[]): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase || ids.length === 0) return;
  await supabase
    .from('knowledge_documents')
    .update({ embedded_at: new Date().toISOString() })
    .in('id', ids);
}

export async function deleteKnowledgeDocuments(ids: number[]): Promise<number> {
  const supabase = createSupabaseAdminClient();
  if (!supabase || ids.length === 0) return 0;
  const { error, count } = await supabase
    .from('knowledge_documents')
    .delete({ count: 'exact' })
    .in('id', ids);
  if (error) throw new Error(errorMessage(error) ?? 'No se pudieron borrar documentos');
  return count ?? ids.length;
}

/** Invalida el caché completo (cuando cambió algún documento). */
export async function invalidateKnowledgeCache(onlyExpired = false): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const query = supabase.from('knowledge_cache').delete();
  const { error } = onlyExpired
    ? await query.lt('expires_at', new Date().toISOString())
    : await query.gte('id', 0);
  if (error && error.code !== 'PGRST205') {
    console.error('Knowledge cache cleanup failed:', error.message);
  }
}

export interface KnowledgeSyncRow {
  actor_email: string;
  mode: string;
  documents: number;
  chunks: number;
  embedded: number;
  skipped: number;
  removed: number;
  duration_ms: number;
  error: string | null;
}

export async function recordKnowledgeSync(row: KnowledgeSyncRow): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const { error } = await supabase.from('knowledge_sync_runs').insert(row);
  if (error) console.error('Knowledge sync log failed:', error.message);
}

export async function countKnowledgeRows(
  table: 'knowledge_documents' | 'knowledge_chunks' | 'knowledge_cache'
): Promise<{ count: number; missing: boolean }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { count: 0, missing: true };
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true });
  if (error) {
    const missing = error.code === 'PGRST205' || error.code === '42P01';
    return { count: 0, missing };
  }
  return { count: count ?? 0, missing: false };
}

export interface KnowledgeRunRow {
  id: number;
  actor_email: string;
  mode: string;
  documents: number;
  chunks: number;
  embedded: number;
  skipped: number;
  removed: number;
  duration_ms: number;
  error: string | null;
  created_at: string;
}

export async function latestKnowledgeRun(): Promise<KnowledgeRunRow | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('knowledge_sync_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as KnowledgeRunRow;
}
