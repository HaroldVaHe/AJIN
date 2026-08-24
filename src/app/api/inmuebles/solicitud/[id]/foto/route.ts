import { NextRequest, NextResponse } from 'next/server';
import { MAX_PHOTO_BYTES } from '@/lib/property-api';
import {
  createSupabaseAdminClient,
  uploadPropertyPhoto,
} from '@/lib/supabase/admin';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(`foto:${clientIp(request)}`, 40)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  const { id: idParam } = await params;
  const propertyId = Number(idParam);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Missing file' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ success: false, error: 'Not an image' }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ success: false, error: 'File too large' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Storage not configured' }, { status: 500 });
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .neq('status', 'approved')
    .maybeSingle();
  if (!property) {
    return NextResponse.json({ success: false, error: 'Property not pending' }, { status: 404 });
  }

  const { count } = await supabase
    .from('property_images')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', propertyId);
  const index = count ?? 0;
  if (index >= 15) {
    return NextResponse.json({ success: false, error: 'Too many photos' }, { status: 400 });
  }

  const uploaded = await uploadPropertyPhoto(propertyId, file, index);
  if (!uploaded) {
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }

  const { error: insertError } = await supabase.from('property_images').insert({
    property_id: propertyId,
    url: uploaded.url,
    path: uploaded.path,
    position: index,
  });
  if (insertError) {
    return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, url: uploaded.url });
}
