import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiWithUser } from '@/lib/property-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { deleteAllPropertyPhotoFiles } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { ok: isAdmin, email: actorEmail } = await requireAdminApiWithUser();
  if (!isAdmin) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'property' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const propertyId = Number((await params).id);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  let body: { order?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const order = body.order;
  if (!Array.isArray(order) || order.some((v) => !Number.isInteger(v))) {
    return NextResponse.json({ success: false, error: 'Invalid order' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const updates = (order as number[]).map((imageId, position) =>
    supabase
      .from('property_images')
      .update({ position })
      .eq('id', imageId)
      .eq('property_id', propertyId)
  );
  await Promise.all(updates);

  await logAudit({
    request,
    actorEmail,
    action: 'photos.reorder',
    entity: 'property',
    entityId: propertyId,
    detail: { order },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { ok: isAdmin, email: actorEmail } = await requireAdminApiWithUser();
  if (!isAdmin) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'property' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const propertyId = Number((await params).id);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { data: images } = await supabase
    .from('property_images')
    .select('id')
    .eq('property_id', propertyId);

  const { error } = await supabase
    .from('property_images')
    .delete()
    .eq('property_id', propertyId);
  if (error) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail,
    action: 'photos.delete_all',
    entity: 'property',
    entityId: propertyId,
    detail: { image_count: images?.length ?? 0 },
  });

  void deleteAllPropertyPhotoFiles(propertyId);
  return NextResponse.json({ success: true });
}
