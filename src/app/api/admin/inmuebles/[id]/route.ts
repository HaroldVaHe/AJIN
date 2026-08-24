import { NextRequest, NextResponse } from 'next/server';
import { parsePropertyPayload, requireAdminApiWithUser } from '@/lib/property-api';
import { createSupabaseAdminClient, deletePropertyFolder } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
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

  const payload = parsePropertyPayload(body);
  if (!payload) {
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const featured = Boolean(body.featured);

  const { data: before } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
  const { error } = await supabase
    .from('properties')
    .update({ ...payload, featured, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }

  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (before) {
    for (const key of Object.keys(payload) as Array<keyof typeof payload>) {
      const prev = before[key];
      const next = payload[key];
      if (String(prev ?? '') !== String(next ?? '')) changes[key] = { from: prev, to: next };
    }
    if (Boolean(before.featured) !== featured) changes['featured'] = { from: before.featured, to: featured };
  }

  await logAudit({
    request,
    actorEmail,
    action: 'property.update',
    entity: 'property',
    entityId: id,
    detail: Object.keys(changes).length > 0 ? { changes } : { note: 'sin cambios detectados' },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { ok: isAdmin, email: actorEmail } = await requireAdminApiWithUser();
  if (!isAdmin) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'property' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail,
    action: 'property.delete',
    entity: 'property',
    entityId: id,
  });

  void deletePropertyFolder(id);
  return NextResponse.json({ success: true });
}
