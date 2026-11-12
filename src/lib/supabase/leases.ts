import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { RECEIPTS_BUCKET, periodStatus, periodTotals } from '@/lib/leases';
import { buildPeriods } from '@/lib/lease-api';
import type { Property } from '@/types/property';
import type {
  Lease,
  LeaseConcept,
  LeaseDetail,
  LeaseReceipt,
  LeaseSummary,
} from '@/types/lease';
import type { Permission, Role } from '@/lib/permissions';
import { isPermission, isRole } from '@/lib/permissions';

const LEASE_FIELDS =
  'id, property_id, tenant_name, tenant_phone, tenant_email, tenant_document, ' +
  'owner_name, owner_phone, owner_email, owner_document, rent_cop, building_fee_cop, ' +
  'agency_mode, agency_value, payment_day, reminder_days, start_date, end_date, status, ' +
  'notes, created_at, updated_at';

type PropertyJoin = { id: number; title: string; city: string; neighborhood: string } | null;

function normalizeProperty(value: unknown): PropertyJoin {
  if (Array.isArray(value)) return (value[0] as PropertyJoin) ?? null;
  return (value as PropertyJoin) ?? null;
}

export async function fetchLeaseList(): Promise<LeaseSummary[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('leases')
    .select(`${LEASE_FIELDS}, properties ( id, title, city, neighborhood )`)
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as unknown[]).map((row) => {
    const { properties, ...lease } = row as Lease & { properties: PropertyJoin };
    return { ...lease, property: normalizeProperty(properties) };
  });
}

async function signReceipts(receipts: LeaseReceipt[]): Promise<LeaseReceipt[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase || receipts.length === 0) return receipts;
  return Promise.all(
    receipts.map(async (receipt) => {
      const { data } = await supabase.storage
        .from(RECEIPTS_BUCKET)
        .createSignedUrl(receipt.path, 60 * 60);
      return { ...receipt, signed_url: data?.signedUrl ?? '' };
    })
  );
}

export async function fetchLeaseDetail(id: number): Promise<LeaseDetail | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const [{ data: lease }, { data: concepts }, { data: periods }, { data: receipts }] =
    await Promise.all([
      supabase.from('leases').select(`${LEASE_FIELDS}, properties ( id, title, city, neighborhood )`).eq('id', id).maybeSingle(),
      supabase.from('lease_concepts').select('*').eq('lease_id', id).order('position'),
      supabase.from('lease_periods').select('*').eq('lease_id', id).order('period'),
      supabase.from('lease_receipts').select('*').eq('lease_id', id).order('created_at', { ascending: false }),
    ]);

  if (!lease) return null;
  const { properties, ...rest } = lease as unknown as Lease & { properties: PropertyJoin };

  return {
    ...rest,
    property: normalizeProperty(properties),
    concepts: (concepts ?? []) as LeaseConcept[],
    periods: (periods ?? []) as LeaseDetail['periods'],
    receipts: await signReceipts((receipts ?? []) as LeaseReceipt[]),
  };
}

/** Inmuebles aprobados disponibles para contratar (marca el que ya tiene contrato activo). */
export async function fetchPropertiesForLease(): Promise<
  Array<Pick<Property, 'id' | 'title' | 'city' | 'neighborhood' | 'price_cop' | 'owner_name' | 'owner_phone' | 'owner_email'> & { active_lease_id: number | null }>
> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const [{ data: properties }, { data: leases }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, title, city, neighborhood, price_cop, owner_name, owner_phone, owner_email')
      .eq('status', 'approved')
      .order('title'),
    supabase.from('leases').select('id, property_id').eq('status', 'active'),
  ]);

  const activeByProperty = new Map<number, number>();
  for (const lease of leases ?? []) activeByProperty.set(lease.property_id, lease.id);

  return (properties ?? []).map((property) => ({
    ...(property as Property),
    active_lease_id: activeByProperty.get(property.id) ?? null,
  }));
}

export async function fetchPropertyForLeasePrefill(id: number) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from('properties')
    .select('id, title, city, neighborhood, price_cop, owner_name, owner_phone, owner_email')
    .eq('id', id)
    .maybeSingle();
  return (data as Property | null) ?? null;
}

export async function generateMissingPeriods(
  lease: Lease,
  concepts: LeaseConcept[],
  months: string[]
): Promise<{ inserted: number; skipped: number }> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { inserted: 0, skipped: months.length };

  const { data: existing } = await supabase
    .from('lease_periods')
    .select('period')
    .eq('lease_id', lease.id);
  const have = new Set((existing ?? []).map((row) => row.period));
  const missing = months.filter((month) => !have.has(month));
  if (missing.length === 0) return { inserted: 0, skipped: months.length };

  const rows = buildPeriods(
    { ...lease, ...mapLeaseToInput(lease) },
    concepts.map((c) => ({
      name: c.name,
      amount_cop: c.amount_cop,
      charge_tenant: c.charge_tenant,
      deduct_owner: c.deduct_owner,
      active: c.active,
    })),
    missing
  );

  const { error } = await supabase.from('lease_periods').insert(rows);
  if (error) {
    console.error('generateMissingPeriods failed:', error.message);
    return { inserted: 0, skipped: months.length };
  }
  return { inserted: rows.length, skipped: months.length - rows.length };
}

function mapLeaseToInput(lease: Lease) {
  return {
    property_id: lease.property_id,
    tenant_name: lease.tenant_name,
    tenant_phone: lease.tenant_phone,
    tenant_email: lease.tenant_email,
    tenant_document: lease.tenant_document,
    owner_name: lease.owner_name,
    owner_phone: lease.owner_phone,
    owner_email: lease.owner_email,
    owner_document: lease.owner_document,
    rent_cop: lease.rent_cop,
    building_fee_cop: lease.building_fee_cop,
    agency_mode: lease.agency_mode,
    agency_value: lease.agency_value,
    payment_day: lease.payment_day,
    reminder_days: lease.reminder_days,
    start_date: lease.start_date,
    end_date: lease.end_date,
    notes: lease.notes,
  };
}

/** Recalcula los meses no pagados con los valores actuales del contrato. */
export async function recalculateUnpaidPeriods(leaseId: number): Promise<number> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return 0;

  const [{ data: lease }, { data: concepts }, { data: periods }] = await Promise.all([
    supabase.from('leases').select(LEASE_FIELDS).eq('id', leaseId).maybeSingle(),
    supabase.from('lease_concepts').select('*').eq('lease_id', leaseId),
    supabase
      .from('lease_periods')
      .select('id, paid_cop, status')
      .eq('lease_id', leaseId)
      .neq('status', 'paid'),
  ]);
  if (!lease || !periods || periods.length === 0) return 0;

  const leaseRow = lease as unknown as Lease;
  const totals = periodTotals(leaseRow, (concepts ?? []) as LeaseConcept[]);

  let updated = 0;
  for (const period of periods) {
    const paid = Number(period.paid_cop ?? 0);
    const { error } = await supabase
      .from('lease_periods')
      .update({
        rent_cop: leaseRow.rent_cop,
        building_cop: leaseRow.building_fee_cop,
        agency_cop: totals.agency,
        extras_tenant_cop: totals.extrasTenant,
        extras_owner_cop: totals.extrasOwner,
        total_due_cop: totals.totalDue,
        owner_payout_cop: totals.ownerPayout,
        status: periodStatus(totals.totalDue, paid),
        updated_at: new Date().toISOString(),
      })
      .eq('id', period.id);
    if (!error) updated += 1;
  }
  return updated;
}

export async function deleteLeaseFolder(leaseId: number): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  const { data } = await supabase.storage.from(RECEIPTS_BUCKET).list(`${leaseId}/`);
  if (data && data.length > 0) {
    await supabase.storage
      .from(RECEIPTS_BUCKET)
      .remove(data.map((file) => `${leaseId}/${file.name}`));
  }
}

export async function deleteReceiptFile(path: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;
  await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
}

export interface RoleData {
  users: Array<{ email: string; role: Role; created_at: string }>;
  permissions: Record<Role, Permission[]>;
}

export async function fetchRolesData(): Promise<RoleData> {
  const supabase = createSupabaseAdminClient();
  const fallback: RoleData = { users: [], permissions: { admin: [], gestor: [] } };
  if (!supabase) return fallback;

  const [{ data: users }, { data: rows }] = await Promise.all([
    supabase.from('user_roles').select('email, role, created_at').order('email'),
    supabase.from('role_permissions').select('role, permission'),
  ]);

  const permissions: Record<Role, Permission[]> = { admin: [], gestor: [] };
  for (const row of rows ?? []) {
    if (isRole(row.role) && isPermission(row.permission)) {
      permissions[row.role].push(row.permission);
    }
  }

  if (permissions.admin.length > 0 && !permissions.admin.includes('roles.manage')) {
    permissions.admin.push('roles.manage');
  }

  return {
    users: (users ?? [])
      .filter((user) => isRole(user.role))
      .map((user) => ({ email: user.email, role: user.role as Role, created_at: user.created_at })),
    permissions,
  };
}

export async function setUserRole(email: string, role: Role): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;
  const { error } = await supabase
    .from('user_roles')
    .upsert({ email, role, updated_at: new Date().toISOString() }, { onConflict: 'email' });
  return !error;
}

export async function removeUserRole(email: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;
  const { error } = await supabase.from('user_roles').delete().eq('email', email);
  return !error;
}

export async function saveRolePermissions(
  role: Role,
  permissions: Permission[]
): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return false;

  const list = Array.from(new Set(permissions));
  if (role === 'admin' && !list.includes('roles.manage')) list.push('roles.manage');

  const { error: deleteError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role', role);
  if (deleteError) return false;

  if (list.length > 0) {
    const { error } = await supabase
      .from('role_permissions')
      .insert(list.map((permission) => ({ role, permission })));
    if (error) return false;
  }
  return true;
}

/** Próxima mensualidad pendiente por contrato (para la lista). */
export async function fetchNextDueByLease(
  ids: number[]
): Promise<Map<number, LeaseDetail['periods'][number]>> {
  const result = new Map<number, LeaseDetail['periods'][number]>();
  if (ids.length === 0) return result;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return result;
  const { data } = await supabase
    .from('lease_periods')
    .select('*')
    .in('lease_id', ids)
    .neq('status', 'paid')
    .order('due_date');
  for (const period of (data ?? []) as LeaseDetail['periods']) {
    if (!result.has(period.lease_id)) result.set(period.lease_id, period);
  }
  return result;
}

/** Mensualidades no pagadas que vencen hasta `horizonISO` (para el cron). */
export async function fetchReminderCandidates(horizonISO: string) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from('lease_periods')
    .select(
      `id, lease_id, period, due_date, total_due_cop, owner_payout_cop, paid_cop, status, reminder_stage, reminded_on,
       leases!inner ( id, status, tenant_name, tenant_phone, owner_name, payment_day,
         properties ( title, city ) )`
    )
    .neq('status', 'paid')
    .lte('due_date', horizonISO)
    .eq('leases.status', 'active')
    .limit(200);
  return data ?? [];
}
