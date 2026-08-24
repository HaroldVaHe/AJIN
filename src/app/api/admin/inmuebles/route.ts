import { NextRequest, NextResponse } from 'next/server';
import { parsePropertyPayload, requireAdminApiWithUser } from '@/lib/property-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const { ok: isAdmin, email: actorEmail } = await requireAdminApiWithUser();
  if (!isAdmin) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'property' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = parsePropertyPayload(body);
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const status = body.status === 'pending' ? 'pending' : 'approved';
  const featured = Boolean(body.featured);

  const { data, error } = await supabase
    .from('properties')
    .insert({
      ...payload,
      status,
      source: 'admin',
      featured,
      published_at: status === 'approved' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Admin create property error:', error);
    return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail,
    action: 'property.create',
    entity: 'property',
    entityId: data.id,
    detail: { title: payload.title, operation: payload.operation, type: payload.type, status },
  });

  return NextResponse.json({ success: true, id: data.id });
}
