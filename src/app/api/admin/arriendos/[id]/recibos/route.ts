import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requirePermissionWithUser } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import {
  MAX_RECEIPT_BYTES,
  RECEIPT_KINDS,
  RECEIPT_MIME,
  RECEIPTS_BUCKET,
  type ReceiptKind,
} from '@/lib/leases';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionWithUser('leases.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'lease' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const leaseId = Number((await params).id);
  if (!Number.isInteger(leaseId) || leaseId <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { data: lease } = await supabase.from('leases').select('id').eq('id', leaseId).maybeSingle();
  if (!lease) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Missing file' }, { status: 400 });
  }
  // El navegador convierte la imagen a WebP antes de subirla.
  if (file.type !== RECEIPT_MIME) {
    return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json({ success: false, error: 'Invalid file size' }, { status: 400 });
  }

  const kindRaw = String(form.get('kind') ?? 'other');
  const kind: ReceiptKind = (RECEIPT_KINDS as readonly string[]).includes(kindRaw)
    ? (kindRaw as ReceiptKind)
    : 'other';
  const label = String(form.get('label') ?? '').trim().slice(0, 120);

  const amountRaw = String(form.get('amount_cop') ?? '').trim();
  const amount = amountRaw ? Number(amountRaw.replace(/[^\d]/g, '')) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 1e12)) {
    return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
  }

  const periodRaw = String(form.get('period_id') ?? '').trim();
  let periodId: number | null = null;
  if (periodRaw) {
    periodId = Number(periodRaw);
    if (!Number.isInteger(periodId)) {
      return NextResponse.json({ success: false, error: 'Invalid period' }, { status: 400 });
    }
    const { data: period } = await supabase
      .from('lease_periods')
      .select('id')
      .eq('id', periodId)
      .eq('lease_id', leaseId)
      .maybeSingle();
    if (!period) {
      return NextResponse.json({ success: false, error: 'Invalid period' }, { status: 400 });
    }
  }

  const path = `${leaseId}/${Date.now()}-${randomBytes(4).toString('hex')}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (uploadError) {
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('lease_receipts')
    .insert({
      lease_id: leaseId,
      period_id: periodId,
      kind,
      label,
      amount_cop: amount,
      path,
    })
    .select('*')
    .single();
  if (insertError || !inserted) {
    await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
    return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 });
  }

  const { data: signed } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'lease.receipt_upload',
    entity: 'lease',
    entityId: leaseId,
    detail: { receipt_id: inserted.id, kind, amount_cop: amount },
  });

  return NextResponse.json({
    success: true,
    receipt: { ...inserted, signed_url: signed?.signedUrl ?? '' },
  });
}
