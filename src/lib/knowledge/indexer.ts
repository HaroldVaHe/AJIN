import { getAiConfig } from '@/lib/ai/config';
import { AiNotConfiguredError, embedTexts } from '@/lib/ai/embeddings';
import {
  deleteKnowledgeDocuments,
  invalidateKnowledgeCache,
  listKnowledgeDocMeta,
  markDocumentsEmbedded,
  recordKnowledgeSync,
  replaceKnowledgeChunks,
  upsertKnowledgeDocs,
  countKnowledgeRows,
  type KnowledgeChunkRow,
  type KnowledgeDocRow,
} from '@/lib/supabase/knowledge';
import { hashContent, chunkText } from './chunk';
import { buildKnowledgeDocs, type KnowledgeDocInput } from './sources';

export class KnowledgeSetupError extends Error {
  code = 'needs_setup';
  constructor(message = 'Falta ejecutar supabase-cerebro.sql en Supabase') {
    super(message);
    this.name = 'KnowledgeSetupError';
  }
}

export interface SyncResult {
  ok: boolean;
  provider: string;
  mode: 'incremental' | 'full';
  documents: number;
  chunks: number;
  embedded: number;
  skipped: number;
  removed: number;
  durationMs: number;
  warnings: string[];
}

function docKey(doc: Pick<KnowledgeDocInput, 'sourceType' | 'sourceId' | 'locale'>): string {
  return `${doc.sourceType}|${doc.sourceId}|${doc.locale}`;
}

function rowKey(row: { source_type: string; source_id: string; locale: string }): string {
  return `${row.source_type}|${row.source_id}|${row.locale}`;
}

function docHash(doc: KnowledgeDocInput): string {
  return hashContent(`${doc.title}\n${JSON.stringify(doc.metadata)}\n${doc.content}`);
}

/**
 * Sincroniza el índice con los datos actuales:
 *  1. construye los documentos (inmuebles, contratos, meses, blog, sitio),
 *  2. omite los que no cambiaron (comparando hash),
 *  3. vectoriza solo los fragmentos nuevos o modificados,
 *  4. elimina documentos que ya no existen,
 *  5. invalida el caché semántico si hubo cambios.
 */
export async function syncKnowledge(
  actorEmail: string,
  options: { force?: boolean } = {}
): Promise<SyncResult> {
  const started = Date.now();
  const config = getAiConfig();
  if (!config) throw new AiNotConfiguredError();

  const mode: SyncResult['mode'] = options.force ? 'full' : 'incremental';
  let documents = 0;
  let embedded = 0;
  let skipped = 0;
  let removed = 0;
  let chunkTotal = 0;
  const warnings: string[] = [];

  try {
    const built = await buildKnowledgeDocs();
    warnings.push(...built.warnings);
    const docs = built.docs;
    documents = docs.length;

    const existing = await listKnowledgeDocMeta();
    if (existing.error) throw new KnowledgeSetupError(existing.error);
    const existingByKey = new Map(existing.rows.map((row) => [rowKey(row), row]));

    const upsertRows: KnowledgeDocRow[] = [];
    const changed: KnowledgeDocInput[] = [];

    for (const doc of docs) {
      const hash = docHash(doc);
      const current = existingByKey.get(docKey(doc));
      const isChanged = Boolean(options.force) || !current || current.content_hash !== hash;
      if (!isChanged) {
        skipped += 1;
        continue;
      }
      const now = new Date().toISOString();
      upsertRows.push({
        source_type: doc.sourceType,
        source_id: doc.sourceId,
        locale: doc.locale,
        title: doc.title,
        content: doc.content,
        metadata: doc.metadata,
        content_hash: hash,
        embedded_at: null,
        updated_at: now,
      });
      changed.push(doc);
    }

    const upserted = await upsertKnowledgeDocs(upsertRows);
    if (upserted.error) throw new KnowledgeSetupError(upserted.error);

    const idByKey = new Map(upserted.rows.map((row) => [rowKey(row), row.id]));

    const pending: Array<{ key: string; documentId: number; index: number; content: string }> = [];
    for (const doc of changed) {
      const documentId = idByKey.get(docKey(doc));
      if (!documentId) continue;
      chunkText(doc.content).forEach((content, index) => {
        pending.push({ key: docKey(doc), documentId, index, content });
      });
    }

    if (pending.length > 0) {
      const vectors = await embedTexts(pending.map((item) => item.content));
      const rows: KnowledgeChunkRow[] = pending.map((item, index) => ({
        document_id: item.documentId,
        chunk_index: item.index,
        content: item.content,
        embedding: vectors[index],
      }));
      const documentIds = [...new Set(pending.map((item) => item.documentId))];
      const chunkError = await replaceKnowledgeChunks(documentIds, rows);
      if (chunkError) throw new KnowledgeSetupError(chunkError);
      await markDocumentsEmbedded(documentIds);
      embedded = rows.length;
    }

    // Borrar documentos que ya no existen solo si todas las fuentes cargaron bien.
    if (warnings.length === 0) {
      const currentKeys = new Set(docs.map(docKey));
      const staleIds = existing.rows
        .filter((row) => !currentKeys.has(rowKey(row)))
        .map((row) => row.id);
      if (staleIds.length > 0) removed = await deleteKnowledgeDocuments(staleIds);
    }

    if (embedded > 0) await invalidateKnowledgeCache();
    await invalidateKnowledgeCache(true);

    const chunkCount = await countKnowledgeRows('knowledge_chunks');
    chunkTotal = chunkCount.count;

    const durationMs = Date.now() - started;
    const result: SyncResult = {
      ok: true,
      provider: config.provider,
      mode,
      documents,
      chunks: chunkTotal,
      embedded,
      skipped,
      removed,
      durationMs,
      warnings,
    };

    await recordKnowledgeSync({
      actor_email: actorEmail.slice(0, 200),
      mode,
      documents,
      chunks: chunkTotal,
      embedded,
      skipped,
      removed,
      duration_ms: durationMs,
      error: warnings.length > 0 ? warnings.join(' | ').slice(0, 1000) : null,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordKnowledgeSync({
      actor_email: actorEmail.slice(0, 200),
      mode,
      documents,
      chunks: chunkTotal,
      embedded,
      skipped,
      removed,
      duration_ms: Date.now() - started,
      error: message.slice(0, 1000),
    }).catch(() => {});
    throw error;
  }
}
