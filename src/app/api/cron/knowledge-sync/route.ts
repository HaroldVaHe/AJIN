import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';
import { isAiConfigured } from '@/lib/ai/config';
import { syncKnowledge } from '@/lib/knowledge/indexer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Sincronización diaria del cerebro (Vercel Cron). Si no hay proveedor de IA
 * configurado responde 200 con `skipped` para no marcar el cron como fallido.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json({ success: true, skipped: true, reason: 'not_configured' });
  }

  try {
    const result = await syncKnowledge('cron@vercel', {});
    await logAudit({
      request,
      actorEmail: 'cron@vercel',
      action: 'cron.knowledge_sync',
      entity: 'knowledge',
      detail: {
        documents: result.documents,
        chunks: result.chunks,
        embedded: result.embedded,
        skipped: result.skipped,
        removed: result.removed,
        duration_ms: result.durationMs,
      },
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Knowledge cron failed:', error);
    await logAudit({
      request,
      actorEmail: 'cron@vercel',
      action: 'cron.knowledge_sync',
      entity: 'knowledge',
      detail: { error: error instanceof Error ? error.message.slice(0, 500) : 'Error' },
    });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    );
  }
}
