import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requirePermissionWithUser } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { periodStatus } from '@/lib/leases';

type Params = { params: Promise<{ id: string; periodId: string }> };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionWithUser('leases.finance');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'lease' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id, periodId } = await params;
  const leaseId = Number(id);
  const periodRowId = Number(periodId);
  if (!Number.isInteger(leaseId) || leaseId <= 0 || !Number.isInteger(periodRowId)) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { data: period } = await supabase
    .from('lease_periods')
    .select('*')
    .eq('id', periodRowId)
    .eq('lease_id', leaseId)
    .maybeSingle();
  if (!period) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const paid =
    body.paid_cop === undefined || body.paid_cop === null
      ? Number(period.paid_cop ?? 0)
      : Number(body.paid_cop);
  if (!Number.isFinite(paid) || paid < 0 || paid > 1e12) {
    return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
  }

  const paidAtRaw = body.paid_at === undefined ? period.paid_at : body.paid_at;
  const paidAt = paidAtRaw === null || paidAtRaw === '' ? null : String(paidAtRaw);
  if (paidAt && !DATE_RE.test(paidAt)) {
    return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 });
  }

  const payoutRaw = body.payout_paid_at === undefined ? period.payout_paid_at : body.payout_paid_at;
  const payoutAt = payoutRaw === null || payoutRaw === '' ? null : String(payoutRaw);
  if (payoutAt && !DATE_RE.test(payoutAt)) {
    return NextResponse.json({ success: false, error: 'Invalid date' }, { status: 400 });
  }

  const notes =
    body.notes === undefined
      ? period.notes
      : String(body.notes ?? '').replace(/\u0000/g, '').trim().slice(0, 1000);

  const status = periodStatus(Number(period.total_due_cop), Math.round(paid));

  const { error } = await supabase
    .from('lease_periods')
    .update({
      paid_cop: Math.round(paid),
      paid_at: paidAt,
      payout_paid_at: payoutAt,
      notes,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', periodRowId)
    .eq('lease_id', leaseId);
  if (error) {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'lease.period_update',
    entity: 'lease',
    entityId: leaseId,
    detail: { period: period.period, paid_cop: Math.round(paid), status },
  });

  return NextResponse.json({ success: true, status });
}
