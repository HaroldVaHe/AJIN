import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiWithUser } from '@/lib/property-api';
import { createSupabaseAdminClient, deletePropertyPhotoFile } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { ok: isAdmin, email: actorEmail } = await requireAdminApiWithUser();
  if (!isAdmin) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'property' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const propertyId = Number((await params).id);
  const imageId = Number((await params).imageId);
  if (!Number.isInteger(propertyId) || !Number.isInteger(imageId)) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { data: image } = await supabase
    .from('property_images')
    .select('id, path')
    .eq('id', imageId)
    .eq('property_id', propertyId)
    .maybeSingle();
  if (!image) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase.from('property_images').delete().eq('id', imageId);
  if (error) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail,
    action: 'photo.delete',
    entity: 'property',
    entityId: propertyId,
    detail: { image_id: image.id, path: image.path },
  });

  void deletePropertyPhotoFile(image.path);
  return NextResponse.json({ success: true });
}
