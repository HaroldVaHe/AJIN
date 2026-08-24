import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiWithUser } from '@/lib/property-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { ok: isAdmin, email: actorEmail } = await requireAdminApiWithUser();
  if (!isAdmin) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'property' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const status = String(body.status ?? '');
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { data: current } = await supabase
    .from('properties')
    .select('published_at')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('properties')
    .update({
      status,
      updated_at: now,
      published_at:
        status === 'approved' ? (current?.published_at ?? now) : current?.published_at ?? null,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail,
    action: 'property.status',
    entity: 'property',
    entityId: id,
    detail: { status },
  });

  return NextResponse.json({ success: true });
}
