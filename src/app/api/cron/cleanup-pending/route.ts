import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, deletePropertyFolder } from '@/lib/supabase/admin';
import { sendToTelegram } from '@/lib/n8n';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Not configured' }, { status: 500 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: stale, error } = await supabase
    .from('properties')
    .select('id')
    .neq('status', 'approved')
    .lt('created_at', cutoff);

  if (error) {
    return NextResponse.json({ success: false, error: 'Query failed' }, { status: 500 });
  }

  let purged = 0;
  for (const row of stale ?? []) {
    try {
      await deletePropertyFolder(row.id);
      await supabase.from('properties').delete().eq('id', row.id);
      purged += 1;
    } catch (e) {
      console.error(`Cleanup failed for property ${row.id}:`, e);
    }
  }

  await logAudit({
    request,
    actorEmail: 'cron@vercel',
    action: 'cron.cleanup',
    detail: { purged, candidates: stale?.length ?? 0 },
  });

  if (purged > 0) {
    void sendToTelegram(
      `🧹 Limpieza de inmuebles: se eliminaron ${purged} solicitudes sin aprobar con más de 30 días.`
    );
  }

  return NextResponse.json({ success: true, purged });
}
