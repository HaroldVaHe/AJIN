export type LeaseStatus = 'active' | 'finished';
export type AgencyMode = 'percent' | 'fixed';
export type PeriodStatus = 'pending' | 'partial' | 'paid';
export type ReceiptKind =
  | 'invoice'
  | 'payment'
  | 'building'
  | 'utility'
  | 'payout'
  | 'other';

export interface Lease {
  id: number;
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
  status: LeaseStatus;
  notes: string;

  created_at: string;
  updated_at: string;
}

export interface LeaseConcept {
  id: number;
  lease_id: number;
  name: string;
  amount_cop: number;
  charge_tenant: boolean;
  deduct_owner: boolean;
  active: boolean;
  position: number;
}

export interface LeasePeriod {
  id: number;
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
  paid_cop: number;
  status: PeriodStatus;
  paid_at: string | null;
  payout_paid_at: string | null;
  notes: string;
  reminder_stage: number;
  reminded_on: string | null;
}

export interface LeaseReceipt {
  id: number;
  lease_id: number;
  period_id: number | null;
  kind: ReceiptKind;
  label: string;
  amount_cop: number | null;
  path: string;
  created_at: string;
  signed_url?: string;
}

export interface LeasePropertySummary {
  id: number;
  title: string;
  city: string;
  neighborhood: string;
}

export interface LeaseSummary extends Lease {
  property: LeasePropertySummary | null;
}

export interface LeaseDetail extends Lease {
  property: LeasePropertySummary | null;
  concepts: LeaseConcept[];
  periods: LeasePeriod[];
  receipts: LeaseReceipt[];
}
