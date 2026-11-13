import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';
import { AiNotConfiguredError, AiRequestError } from '@/lib/ai/embeddings';
import { askKnowledge, KnowledgeQuestionError } from '@/lib/knowledge/answer';
import { KnowledgeSetupError } from '@/lib/knowledge/indexer';
import { getKnowledgeStatus } from '@/lib/knowledge/status';
import { requirePermissionWithUser } from '@/lib/permissions';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Estado del índice y del proveedor de IA. */
export async function GET() {
  const auth = await requirePermissionWithUser('knowledge.view');
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const status = await getKnowledgeStatus();
  return NextResponse.json({ success: true, status });
}

/** Pregunta al cerebro interno. */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionWithUser('knowledge.view');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'knowledge' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const key = `cerebro:${auth.email || clientIp(request)}`;
  if (!rateLimit(key, 30, 60 * 60 * 1000)) {
    return NextResponse.json(
      { success: false, code: 'rate_limited', error: 'Too many requests' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, code: 'invalid_question', error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const locale = body.locale === 'en' ? 'en' : 'es';
  if (question.length < 3 || question.length > 500) {
    return NextResponse.json(
      { success: false, code: 'invalid_question', error: 'Question length out of range' },
      { status: 400 }
    );
  }

  try {
    const result = await askKnowledge(question, locale);
    await logAudit({
      request,
      actorEmail: auth.email,
      action: 'knowledge.ask',
      entity: 'knowledge',
      detail: {
        cached: result.cached,
        insufficient: result.insufficient,
        sources: result.sources.length,
        latency_ms: result.latencyMs,
        question_length: question.length,
      },
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof KnowledgeQuestionError) {
      return NextResponse.json(
        { success: false, code: 'invalid_question', error: error.message },
        { status: 400 }
      );
    }
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
    if (error instanceof AiRequestError) {
      return NextResponse.json(
        { success: false, code: 'ai_error', error: error.message },
        { status: 502 }
      );
    }
    console.error('Knowledge ask failed:', error);
    return NextResponse.json(
      { success: false, code: 'error', error: 'No se pudo responder la pregunta' },
      { status: 500 }
    );
  }
}
