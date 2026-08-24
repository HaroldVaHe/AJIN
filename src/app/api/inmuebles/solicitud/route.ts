import { NextRequest, NextResponse } from 'next/server';
import { MAX_PHOTOS, parsePropertyPayload } from '@/lib/property-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyPropertyRequest } from '@/lib/property-notify';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  if (!rateLimit(`solicitud:${clientIp(request)}`, 5)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
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

  const photoCount = Number(body.photo_count ?? 0);
  if (!Number.isFinite(photoCount) || photoCount < 0 || photoCount > MAX_PHOTOS) {
    return NextResponse.json({ success: false, error: 'Invalid photo count' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Storage not configured' }, { status: 500 });
  }

  const { data: created, error } = await supabase
    .from('properties')
    .insert({ ...payload, status: 'pending', source: 'client' })
    .select('id')
    .single();

  if (error || !created) {
    console.error('Solicitud insert error:', error);
    return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 });
  }

  const propertyId = created.id as number;

  await Promise.all([
    notifyPropertyRequest({
      id: propertyId,
      operation: payload.operation,
      type: payload.type,
      title: payload.title,
      price_cop: payload.price_cop,
      owner_name: payload.owner_name,
      owner_phone: payload.owner_phone,
      owner_email: payload.owner_email || undefined,
      neighborhood: payload.neighborhood || undefined,
      city: payload.city,
      photos: photoCount,
    }),
    logAudit({
      request,
      actorEmail: payload.owner_email || `dueño:${payload.owner_name}`,
      action: 'submission.create',
      entity: 'property',
      entityId: propertyId,
      detail: {
        title: payload.title,
        operation: payload.operation,
        type: payload.type,
        city: payload.city,
        price_cop: payload.price_cop,
        photos: photoCount,
        owner_name: payload.owner_name,
        owner_phone: payload.owner_phone,
      },
    }),
  ]);

  return NextResponse.json({ success: true, id: propertyId });
}
