import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiWithUser } from '@/lib/property-api';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/lib/audit';
import { addMonths, dueDateFor, monthsBetween, periodOf, periodTotals, periodStatus } from '@/lib/leases';
import type { AgencyMode } from '@/types/lease';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface LeaseInput {
  property_id: number;
  tenant_name: string;
  tenant_phone: string;
  tenant_email: string;
  tenant_document: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  owner_document: string;
  rent_cop: number;
  building_fee_cop: number;
  agency_mode: AgencyMode;
  agency_value: number;
  payment_day: number;
  reminder_days: number[];
  start_date: string;
  end_date: string | null;
  notes: string;
}

export interface ConceptInput {
  name: string;
  amount_cop: number;
  charge_tenant: boolean;
  deduct_owner: boolean;
  active: boolean;
}

function text(value: unknown, max: number): string {
  return String(value ?? '').replace(/\u0000/g, '').trim().slice(0, max);
}

function money(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1e12) return null;
  return Math.round(n);
}

export function parseLease(body: Record<string, unknown>): LeaseInput | null {
  const propertyId = Number(body.property_id);
  if (!Number.isInteger(propertyId) || propertyId <= 0) return null;

  const tenantName = text(body.tenant_name, 120);
  const tenantPhone = text(body.tenant_phone, 30);
  const ownerName = text(body.owner_name, 120);
  const ownerPhone = text(body.owner_phone, 30);
  if (!tenantName || !ownerName) return null;
  if (tenantPhone.replace(/\D/g, '').length < 7) return null;
  if (ownerPhone.replace(/\D/g, '').length < 7) return null;

  const tenantEmail = text(body.tenant_email, 160);
  const ownerEmail = text(body.owner_email, 160);
  if (tenantEmail && !EMAIL_RE.test(tenantEmail)) return null;
  if (ownerEmail && !EMAIL_RE.test(ownerEmail)) return null;

  const rent = money(body.rent_cop);
  const building = money(body.building_fee_cop) ?? 0;
  if (rent === null || rent <= 0) return null;

  const agencyMode: AgencyMode = body.agency_mode === 'fixed' ? 'fixed' : 'percent';
  const agencyValue = Number(body.agency_value);
  if (!Number.isFinite(agencyValue) || agencyValue < 0 || agencyValue > 1e12) return null;
  if (agencyMode === 'percent' && agencyValue > 100) return null;

  const paymentDay = Number(body.payment_day);
  if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 28) return null;

  const startDate = text(body.start_date, 10);
  if (!DATE_RE.test(startDate)) return null;
  const endDateRaw = text(body.end_date, 10);
  const endDate = endDateRaw ? (DATE_RE.test(endDateRaw) ? endDateRaw : null) : null;
  if (endDateRaw && !endDate) return null;
  if (endDate && endDate < startDate) return null;

  const reminderDays = Array.isArray(body.reminder_days)
    ? body.reminder_days
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 30)
        .slice(0, 6)
    : [5, 1];

  return {
    property_id: propertyId,
    tenant_name: tenantName,
    tenant_phone: tenantPhone,
    tenant_email: tenantEmail,
    tenant_document: text(body.tenant_document, 40),
    owner_name: ownerName,
    owner_phone: ownerPhone,
    owner_email: ownerEmail,
    owner_document: text(body.owner_document, 40),
    rent_cop: rent,
    building_fee_cop: building,
    agency_mode: agencyMode,
    agency_value: agencyMode === 'fixed' ? Math.round(agencyValue) : Math.round(agencyValue * 100) / 100,
    payment_day: paymentDay,
    reminder_days: reminderDays.length > 0 ? reminderDays : [5, 1],
    start_date: startDate,
    end_date: endDate,
    notes: text(body.notes, 2000),
  };
}

export function parseConcepts(raw: unknown): ConceptInput[] | null {
  if (!Array.isArray(raw)) return [];
  if (raw.length > 20) return null;
  const concepts: ConceptInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    const name = text(row.name, 80);
    if (!name) continue;
    const amount = money(row.amount_cop);
    if (amount === null) return null;
    concepts.push({
      name,
      amount_cop: amount,
      charge_tenant: Boolean(row.charge_tenant),
      deduct_owner: Boolean(row.deduct_owner),
      active: row.active === undefined ? true : Boolean(row.active),
    });
  }
  return concepts;
}

/** Próximo mes a generar si no se indica otro. */
export function defaultHorizon(startDate: string, endDate: string | null): string {
  const today = periodOf(new Date());
  const fromStart = addMonths(startDate.slice(0, 7), 11);
  const horizon = fromStart > today ? fromStart : today;
  if (endDate) {
    const endMonth = endDate.slice(0, 7);
    return endMonth < horizon ? endMonth : horizon;
  }
  return horizon;
}

export interface PeriodRow {
  lease_id: number;
  period: string;
  due_date: string;
  rent_cop: number;
  building_cop: number;
  agency_cop: number;
  extras_tenant_cop: number;
  extras_owner_cop: number;
  total_due_cop: number;
  owner_payout_cop: number;
  status: 'pending' | 'partial' | 'paid';
  paid_cop: number;
}

/** Filas de mensualidad calculadas con los valores actuales del contrato. */
export function buildPeriods(
  lease: LeaseInput & { id: number },
  concepts: ConceptInput[],
  months: string[]
): PeriodRow[] {
  const totals = periodTotals(lease, concepts);
  return months.map((period) => ({
    lease_id: lease.id,
    period,
    due_date: dueDateFor(period, lease.payment_day),
    rent_cop: lease.rent_cop,
    building_cop: lease.building_fee_cop,
    agency_cop: totals.agency,
    extras_tenant_cop: totals.extrasTenant,
    extras_owner_cop: totals.extrasOwner,
    total_due_cop: totals.totalDue,
    owner_payout_cop: totals.ownerPayout,
    status: periodStatus(totals.totalDue, 0),
    paid_cop: 0,
  }));
}

export async function auditUnauthorized(request: NextRequest, entity: string) {
  await logAudit({ request, action: 'admin.unauthorized', entity });
}

/** Valida que el inmueble exista; evita crear contratos huérfanos. */
export async function propertyExists(id: number): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;
  const { data } = await supabase.from('properties').select('id').eq('id', id).maybeSingle();
  return Boolean(data);
}
