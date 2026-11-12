import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requirePermissionWithUser } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { defaultHorizon } from '@/lib/lease-api';
import { monthsBetween } from '@/lib/leases';
import { generateMissingPeriods } from '@/lib/supabase/leases';
import type { Lease, LeaseConcept } from '@/types/lease';

type Params = { params: Promise<{ id: string }> };

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionWithUser('leases.manage');
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const [{ data: lease }, { data: concepts }] = await Promise.all([
    supabase.from('leases').select('*').eq('id', id).maybeSingle(),
    supabase.from('lease_concepts').select('*').eq('lease_id', id).order('position'),
  ]);
  if (!lease) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const requested = String(body.horizon ?? '');
  const horizon = MONTH_RE.test(requested)
    ? requested
    : defaultHorizon(lease.start_date, lease.end_date);
  const startMonth = String(lease.start_date).slice(0, 7);
  if (horizon < startMonth) {
    return NextResponse.json({ success: false, error: 'Invalid horizon' }, { status: 400 });
  }

  const months = monthsBetween(startMonth, horizon);
  const result = await generateMissingPeriods(
    lease as Lease,
    (concepts ?? []) as LeaseConcept[],
    months
  );

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'lease.periods_generate',
    entity: 'lease',
    entityId: id,
    detail: { horizon, inserted: result.inserted, skipped: result.skipped },
  });

  return NextResponse.json({ success: true, ...result, horizon });
}
