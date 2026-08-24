import { NextRequest, NextResponse } from 'next/server';
import { MAX_PHOTOS, MAX_PHOTO_BYTES, requireAdminApi } from '@/lib/property-api';
import { createSupabaseAdminClient, uploadPropertyPhoto } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const propertyId = Number((await params).id);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return NextResponse.json({ success: false, error: 'Invalid file' }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ success: false, error: 'File too large' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { count } = await supabase
    .from('property_images')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', propertyId);
  const index = count ?? 0;
  if (index >= MAX_PHOTOS) {
    return NextResponse.json({ success: false, error: 'Too many photos' }, { status: 400 });
  }

  const uploaded = await uploadPropertyPhoto(propertyId, file, index);
  if (!uploaded) {
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }

  const { data: image, error } = await supabase
    .from('property_images')
    .insert({
      property_id: propertyId,
      url: uploaded.url,
      path: uploaded.path,
      position: index,
    })
    .select('*')
    .single();

  if (error || !image) {
    return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, image });
}
