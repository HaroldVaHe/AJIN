import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requirePermissionWithUser } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { deleteReceiptFile } from '@/lib/supabase/leases';

type Params = { params: Promise<{ id: string; receiptId: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requirePermissionWithUser('leases.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'lease' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id, receiptId } = await params;
  const leaseId = Number(id);
  const rowId = Number(receiptId);
  if (!Number.isInteger(leaseId) || leaseId <= 0 || !Number.isInteger(rowId)) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const { data: receipt } = await supabase
    .from('lease_receipts')
    .select('id, path')
    .eq('id', rowId)
    .eq('lease_id', leaseId)
    .maybeSingle();
  if (!receipt) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('lease_receipts')
    .delete()
    .eq('id', rowId)
    .eq('lease_id', leaseId);
  if (error) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }
  await deleteReceiptFile(receipt.path);

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'lease.receipt_delete',
    entity: 'lease',
    entityId: leaseId,
    detail: { receipt_id: rowId, path: receipt.path },
  });

  return NextResponse.json({ success: true });
}
