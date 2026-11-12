import type {
  Lease,
  LeaseConcept,
  LeasePeriod,
  LeaseReceipt,
} from '@/types/lease';

export const RECEIPTS_BUCKET = 'recibos';
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/** Los soportes se convierten a WebP en el navegador antes de subirse. */
export const RECEIPT_MIME = 'image/webp';

export const RECEIPT_KINDS = [
  'invoice',
  'payment',
  'building',
  'utility',
  'payout',
  'other',
] as const;

export type ReceiptKind = (typeof RECEIPT_KINDS)[number];

/** Comisión de gestión: % del canon o valor fijo mensual. */
export function agencyAmount(lease: {
  rent_cop: number;
  agency_mode: 'percent' | 'fixed';
  agency_value: number;
}): number {
  if (lease.agency_mode === 'fixed') {
    return Math.max(0, Math.round(lease.agency_value));
  }
  return Math.max(0, Math.round((lease.rent_cop * lease.agency_value) / 100));
}

export interface PeriodTotals {
  agency: number;
  extrasTenant: number;
  extrasOwner: number;
  totalDue: number;
  ownerPayout: number;
}

/**
 * Calcula lo que se cobra al inquilino y lo que se gira al propietario:
 *   cobro = canon + extras que paga el inquilino
 *   giro  = canon + extras cobrados - comisión - administración del conjunto
 *           - gastos del propietario
 * La administración del conjunto la paga el propietario: no se cobra al
 * inquilino y se descuenta del giro.
 */
export function periodTotals(
  lease: Pick<Lease, 'rent_cop' | 'building_fee_cop' | 'agency_mode' | 'agency_value'>,
  concepts: Array<Pick<LeaseConcept, 'amount_cop' | 'charge_tenant' | 'deduct_owner' | 'active'>>
): PeriodTotals {
  const active = concepts.filter((c) => c.active);
  const extrasTenant = active
    .filter((c) => c.charge_tenant)
    .reduce((sum, c) => sum + Math.max(0, Math.round(c.amount_cop)), 0);
  const extrasOwner = active
    .filter((c) => c.deduct_owner)
    .reduce((sum, c) => sum + Math.max(0, Math.round(c.amount_cop)), 0);
  const agency = agencyAmount(lease);
  const totalDue = lease.rent_cop + extrasTenant;
  const ownerPayout =
    lease.rent_cop + extrasTenant - agency - lease.building_fee_cop - extrasOwner;

  return {
    agency,
    extrasTenant,
    extrasOwner,
    totalDue: Math.max(0, totalDue),
    ownerPayout: Math.round(ownerPayout),
  };
}

export function periodStatus(totalDue: number, paid: number): LeasePeriod['status'] {
  if (paid <= 0) return 'pending';
  if (paid < totalDue) return 'partial';
  return 'paid';
}

/** Fecha de pago del mes `period` ('YYYY-MM') ajustada al día pactado. */
export function dueDateFor(period: string, paymentDay: number): string {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(Math.max(1, paymentDay), lastDay);
  return `${period}-${String(day).padStart(2, '0')}`;
}

export function periodOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Lista de meses 'YYYY-MM' entre dos fechas (incluidas). */
export function monthsBetween(startISO: string, endISO: string): string[] {
  const [sy, sm] = startISO.split('-').map(Number);
  const [ey, em] = endISO.split('-').map(Number);
  if (!sy || !sm || !ey || !em) return [];
  const months: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (months.length > 120) break;
  }
  return months;
}

export function addMonths(period: string, delta: number): string {
  const [y, m] = period.split('-').map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/**
 * Etapa de recordatorio según la fecha de pago:
 * 1 = un día antes, 2 = día de pago, 3 = vencido (se recuerda cada día
 * hasta que la mensualidad se marque pagada).
 */
export function reminderStageFor(dueDate: string, todayISO: string): 0 | 1 | 2 | 3 {
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const today = Date.parse(`${todayISO}T00:00:00Z`);
  if (!Number.isFinite(due) || !Number.isFinite(today)) return 0;
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return 3;
  if (diff === 0) return 2;
  if (diff === 1) return 1;
  return 0;
}

export function reminderLabel(stage: 0 | 1 | 2 | 3, locale: 'es' | 'en'): string {
  const labels = {
    es: ['—', 'Próximo', 'Vence hoy', 'Vencido'],
    en: ['—', 'Upcoming', 'Due today', 'Overdue'],
  } as const;
  return labels[locale][stage];
}

export function isOverdue(period: Pick<LeasePeriod, 'status' | 'due_date'>, todayISO: string): boolean {
  return period.status !== 'paid' && period.due_date < todayISO;
}

export function nextDuePeriod(periods: LeasePeriod[]): LeasePeriod | null {
  const pending = periods
    .filter((p) => p.status !== 'paid')
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  return pending[0] ?? null;
}

export function receiptsForPeriod(receipts: LeaseReceipt[], periodId: number | null) {
  if (periodId === null) return receipts;
  return receipts.filter((r) => r.period_id === periodId);
}
