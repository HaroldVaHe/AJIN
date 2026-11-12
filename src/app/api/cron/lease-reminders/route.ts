import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';
import { escapeTelegram, sendToTelegram } from '@/lib/n8n';
import { reminderStageFor } from '@/lib/leases';
import { fetchReminderCandidates } from '@/lib/supabase/leases';

interface LeaseJoin {
  id: number;
  tenant_name: string;
  tenant_phone: string;
  owner_name: string;
  properties: { title: string; city: string } | Array<{ title: string; city: string }> | null;
}

interface Candidate {
  id: number;
  lease_id: number;
  period: string;
  due_date: string;
  total_due_cop: number;
  owner_payout_cop: number;
  paid_cop: number;
  status: string;
  reminder_stage: number;
  reminded_on: string | null;
  leases: LeaseJoin | LeaseJoin[];
}

function joinLease(value: LeaseJoin | LeaseJoin[]): LeaseJoin | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function joinProperty(value: LeaseJoin['properties']): { title: string; city: string } | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function money(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const STAGE_LABEL = ['', 'Próximo', 'Vence hoy', 'Vencido'] as const;

/**
 * Recordatorios de cobro por Telegram. Se ejecuta a diario (Vercel Cron):
 * un aviso un día antes, otro el día de pago y, si está vencida, uno cada
 * día hasta que la mensualidad se marque pagada.
 */
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

  const today = new Date();
  const todayISO = isoDay(today);
  const tomorrow = new Date(today.getTime() + 86400000);
  const candidates = (await fetchReminderCandidates(isoDay(tomorrow))) as unknown as Candidate[];

  let sent = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const lease = joinLease(candidate.leases);
    if (!lease) continue;

    const stage = reminderStageFor(candidate.due_date, todayISO);
    if (stage === 0) continue;
    // Vencido: un recordatorio por día. Próximo / vence hoy: una sola vez por etapa.
    if (stage === 3 && candidate.reminded_on === todayISO) continue;
    if (stage !== 3 && stage <= Number(candidate.reminder_stage ?? 0)) continue;

    const property = joinProperty(lease.properties);
    const pending = Math.max(0, Number(candidate.total_due_cop) - Number(candidate.paid_cop));
    const message =
      `<b>🔔 Recordatorio de arriendo</b>\n\n` +
      `<b>Inmueble:</b> ${escapeTelegram(property?.title ?? `#${lease.id}`)}` +
      (property?.city ? ` (${escapeTelegram(property.city)})` : '') +
      `\n<b>Contrato:</b> #${lease.id} · ${escapeTelegram(candidate.period)}\n` +
      `<b>Inquilino:</b> ${escapeTelegram(lease.tenant_name)} — ${escapeTelegram(lease.tenant_phone)}\n` +
      `<b>Vence:</b> ${escapeTelegram(candidate.due_date)}\n` +
      `<b>A cobrar:</b> $${money(pending)} COP\n` +
      `<b>Giro propietario:</b> $${money(Number(candidate.owner_payout_cop))} COP\n` +
      `<b>Estado:</b> ${STAGE_LABEL[stage]}`;

    try {
      await sendToTelegram(message);
      const { error } = await supabase
        .from('lease_periods')
        .update({ reminder_stage: stage, reminded_on: todayISO })
        .eq('id', candidate.id);
      if (error) throw error;
      sent += 1;
    } catch (e) {
      failed += 1;
      console.error(`Lease reminder failed for period ${candidate.id}:`, e);
    }
  }

  await logAudit({
    request,
    actorEmail: 'cron@vercel',
    action: 'cron.lease_reminders',
    detail: { candidates: candidates.length, sent, failed, horizon: isoDay(tomorrow) },
  });

  return NextResponse.json({ success: true, candidates: candidates.length, sent, failed });
}
