import { getAiConfig, publicAiInfo } from '@/lib/ai/config';
import { countKnowledgeRows, latestKnowledgeRun } from '@/lib/supabase/knowledge';
import { includePii } from './sources';

export interface KnowledgeStatus {
  configured: boolean;
  provider: string | null;
  embeddingModel: string | null;
  chatModel: string | null;
  cacheEnabled: boolean;
  includePii: boolean;
  needsSetup: boolean;
  indexed: boolean;
  documents: number;
  chunks: number;
  cacheEntries: number;
  lastSync: {
    at: string;
    actor: string;
    mode: string;
    documents: number;
    chunks: number;
    embedded: number;
    skipped: number;
    removed: number;
    durationMs: number;
    error: string | null;
  } | null;
}

export async function getKnowledgeStatus(): Promise<KnowledgeStatus> {
  const info = publicAiInfo();
  const config = getAiConfig();

  const [documents, chunks, cache] = await Promise.all([
    countKnowledgeRows('knowledge_documents'),
    countKnowledgeRows('knowledge_chunks'),
    countKnowledgeRows('knowledge_cache'),
  ]);

  const needsSetup = documents.missing || chunks.missing || cache.missing;
  const lastRun = needsSetup ? null : await latestKnowledgeRun();

  return {
    ...info,
    cacheEnabled: config?.cacheEnabled ?? true,
    includePii: includePii(),
    needsSetup,
    indexed: documents.count > 0,
    documents: documents.count,
    chunks: chunks.count,
    cacheEntries: cache.count,
    lastSync: lastRun
      ? {
          at: lastRun.created_at,
          actor: lastRun.actor_email,
          mode: lastRun.mode,
          documents: lastRun.documents,
          chunks: lastRun.chunks,
          embedded: lastRun.embedded,
          skipped: lastRun.skipped,
          removed: lastRun.removed,
          durationMs: lastRun.duration_ms,
          error: lastRun.error,
        }
      : null,
  };
}
