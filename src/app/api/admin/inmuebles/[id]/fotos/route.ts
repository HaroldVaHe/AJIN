import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/property-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAdminApi())) {
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

  return NextResponse.json({ success: true });
}
