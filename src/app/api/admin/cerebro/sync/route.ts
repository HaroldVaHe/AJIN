import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';
import { AiNotConfiguredError } from '@/lib/ai/embeddings';
import { KnowledgeSetupError, syncKnowledge } from '@/lib/knowledge/indexer';
import { requirePermissionWithUser } from '@/lib/permissions';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Reindexa el cerebro (incremental o completo). */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionWithUser('knowledge.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'knowledge' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(`cerebro-sync:${auth.email}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, code: 'rate_limited', error: 'Too many requests' },
      { status: 429 }
    );
  }

  let force = false;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    force = body.force === true;
  } catch {
    force = false;
  }

  try {
    const result = await syncKnowledge(auth.email, { force });
    await logAudit({
      request,
      actorEmail: auth.email,
      action: 'knowledge.sync',
      entity: 'knowledge',
      detail: {
        mode: result.mode,
        documents: result.documents,
        chunks: result.chunks,
        embedded: result.embedded,
        skipped: result.skipped,
        removed: result.removed,
        duration_ms: result.durationMs,
        warnings: result.warnings.length,
      },
    });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return NextResponse.json(
        { success: false, code: 'not_configured', error: error.message },
        { status: 503 }
      );
    }
    if (error instanceof KnowledgeSetupError) {
      return NextResponse.json(
        { success: false, code: 'needs_setup', error: error.message },
        { status: 503 }
      );
    }
    console.error('Knowledge sync failed:', error);
    return NextResponse.json(
      { success: false, code: 'error', error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
