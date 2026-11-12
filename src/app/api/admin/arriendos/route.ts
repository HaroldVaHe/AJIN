import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requirePermissionWithUser } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import {
  buildPeriods,
  defaultHorizon,
  parseConcepts,
  parseLease,
  propertyExists,
} from '@/lib/lease-api';
import { monthsBetween } from '@/lib/leases';

export async function POST(request: NextRequest) {
  const auth = await requirePermissionWithUser('leases.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'lease' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object') throw new Error('invalid');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const lease = parseLease(body);
  const concepts = parseConcepts(body.concepts);
  if (!lease || concepts === null) {
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }

  if (!(await propertyExists(lease.property_id))) {
    return NextResponse.json({ success: false, error: 'Property not found' }, { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { data: activeLease } = await supabase
    .from('leases')
    .select('id')
    .eq('property_id', lease.property_id)
    .eq('status', 'active')
    .maybeSingle();
  if (activeLease) {
    return NextResponse.json({ success: false, error: 'Property already leased' }, { status: 409 });
  }

  const { data: created, error } = await supabase
    .from('leases')
    .insert({ ...lease, status: 'active' })
    .select('id')
    .single();
  if (error || !created) {
    return NextResponse.json({ success: false, error: 'Create failed' }, { status: 500 });
  }

  if (concepts.length > 0) {
    await supabase.from('lease_concepts').insert(
      concepts.map((concept, index) => ({
        lease_id: created.id,
        ...concept,
        position: index,
      }))
    );
  }

  // Se generan los meses desde el inicio del contrato hasta el horizonte
  // por defecto (fin de contrato o 11 meses desde el inicio).
  const horizon = defaultHorizon(lease.start_date, lease.end_date);
  const months = monthsBetween(lease.start_date.slice(0, 7), horizon);
  const periods = buildPeriods({ ...lease, id: created.id }, concepts, months);
  if (periods.length > 0) {
    await supabase.from('lease_periods').insert(periods);
  }

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'lease.create',
    entity: 'lease',
    entityId: created.id,
    detail: {
      property_id: lease.property_id,
      rent_cop: lease.rent_cop,
      periods: periods.length,
      concepts: concepts.length,
    },
  });

  return NextResponse.json({ success: true, id: created.id, periods: periods.length });
}
