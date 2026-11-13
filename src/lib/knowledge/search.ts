import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { KnowledgeSetupError } from './indexer';

export interface RetrievedChunk {
  chunk_id: number;
  document_id: number;
  source_type: string;
  source_id: string;
  locale: string;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
  score: number;
}

function isMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST202' || error.code === '42P01' || error.code === 'PGRST205') return true;
  return /does not exist|not find/i.test(error.message ?? '');
}

/** Búsqueda híbrida (vector + palabras clave) sobre los fragmentos indexados. */
export async function retrieveKnowledge(
  embedding: number[],
  question: string,
  limit = 12
): Promise<RetrievedChunk[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new KnowledgeSetupError('Supabase no configurado');

  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    query_text: question,
    match_count: limit,
    min_similarity: 0.12,
  });

  if (error) {
    if (isMissing(error)) throw new KnowledgeSetupError(error.message);
    throw new Error(`Búsqueda semántica: ${error.message}`);
  }

  return ((data ?? []) as RetrievedChunk[]).filter(
    (chunk) => chunk && typeof chunk.content === 'string' && chunk.content.trim().length > 0
  );
}

export interface CachedAnswer {
  id: number;
  answer: string;
  sources: unknown;
  similarity: number;
}

export async function findCachedAnswer(
  embedding: number[],
  locale: string,
  threshold: number
): Promise<CachedAnswer | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc('match_knowledge_cache', {
    query_embedding: embedding,
    cache_locale: locale,
    min_similarity: threshold,
  });

  if (error) {
    // El caché es opcional: si la función no existe o falla, seguimos sin él.
    if (!isMissing(error)) console.error('Semantic cache lookup failed:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? (data[0] as CachedAnswer | undefined) : undefined;
  if (!row || !row.answer) return null;
  return row;
}

export async function touchCacheEntry(id: number): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const { data } = await supabase
    .from('knowledge_cache')
    .select('hits')
    .eq('id', id)
    .maybeSingle();
  const hits = Number((data as { hits?: number } | null)?.hits ?? 0) + 1;
  await supabase
    .from('knowledge_cache')
    .update({ hits, last_hit_at: new Date().toISOString() })
    .eq('id', id);
}

export async function storeCachedAnswer(input: {
  question: string;
  locale: string;
  embedding: number[];
  answer: string;
  sources: unknown;
  ttlDays: number;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const expiresAt = new Date(Date.now() + input.ttlDays * 86400000).toISOString();
  const { error } = await supabase.from('knowledge_cache').insert({
    question: input.question.slice(0, 1000),
    locale: input.locale,
    embedding: input.embedding,
    answer: input.answer,
    sources: input.sources,
    expires_at: expiresAt,
  });
  if (error && !isMissing(error)) console.error('Semantic cache insert failed:', error.message);
}
