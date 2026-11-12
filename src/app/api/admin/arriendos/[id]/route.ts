import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requirePermissionWithUser } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { parseConcepts, parseLease } from '@/lib/lease-api';
import { deleteLeaseFolder, recalculateUnpaidPeriods } from '@/lib/supabase/leases';

type Params = { params: Promise<{ id: string }> };

async function leaseId(params: Params['params']): Promise<number> {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? id : 0;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionWithUser('leases.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'lease' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = await leaseId(params);
  if (!id) return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const lease = parseLease(body);
  const concepts = parseConcepts(body.concepts);
  if (!lease || concepts === null) {
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { data: current } = await supabase
    .from('leases')
    .select('property_id')
    .eq('id', id)
    .maybeSingle();
  if (!current) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  if (current.property_id !== lease.property_id) {
    const { data: conflict } = await supabase
      .from('leases')
      .select('id')
      .eq('property_id', lease.property_id)
      .eq('status', 'active')
      .neq('id', id)
      .maybeSingle();
    if (conflict) {
      return NextResponse.json({ success: false, error: 'Property already leased' }, { status: 409 });
    }
  }

  const { error } = await supabase
    .from('leases')
    .update({ ...lease, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }

  await supabase.from('lease_concepts').delete().eq('lease_id', id);
  if (concepts.length > 0) {
    await supabase.from('lease_concepts').insert(
      concepts.map((concept, index) => ({ lease_id: id, ...concept, position: index }))
    );
  }

  // Los meses ya pagados se conservan como histórico; los pendientes se
  // recalculan con los nuevos valores del contrato.
  const recalculated = await recalculateUnpaidPeriods(id);

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'lease.update',
    entity: 'lease',
    entityId: id,
    detail: {
      rent_cop: lease.rent_cop,
      building_fee_cop: lease.building_fee_cop,
      concepts: concepts.length,
      recalculated,
    },
  });

  return NextResponse.json({ success: true, recalculated });
}

export async function POST(request: NextRequest, { params }: Params) {
  // Cambio de estado (activo/finalizado) sin tocar el resto del contrato.
  const auth = await requirePermissionWithUser('leases.manage');
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const id = await leaseId(params);
  if (!id) return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }
  const status = body.status === 'finished' ? 'finished' : 'active';

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }
  const { error } = await supabase
    .from('leases')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'lease.status',
    entity: 'lease',
    entityId: id,
    detail: { status },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionWithUser('leases.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'lease' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = await leaseId(params);
  if (!id) return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { error } = await supabase.from('leases').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
  await deleteLeaseFolder(id);

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'lease.delete',
    entity: 'lease',
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
