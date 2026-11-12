'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { periodTotals } from '@/lib/leases';
import type { LeaseDetail } from '@/types/lease';
import type { AgencyMode } from '@/types/lease';

export interface LeasePropertyOption {
  id: number;
  title: string;
  city: string;
  neighborhood: string;
  price_cop: number;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  active_lease_id: number | null;
}

interface LeaseFormProps {
  properties: LeasePropertyOption[];
  lease?: LeaseDetail | null;
  defaultPropertyId?: number | null;
}

interface ConceptRow {
  name: string;
  amount_cop: string;
  charge_tenant: boolean;
  deduct_owner: boolean;
  active: boolean;
}

const input =
  'w-full rounded-xl border border-ajin-border px-3 py-2 text-sm focus:border-ajin-accent focus:outline-none';

const money = (value: number) => `$${new Intl.NumberFormat('es-CO').format(Math.round(value))}`;

export default function LeaseForm({ properties, lease, defaultPropertyId }: LeaseFormProps) {
  const router = useRouter();
  const t = useTranslations('admin.leases.form');
  const isEdit = Boolean(lease);

  const [propertyId, setPropertyId] = useState<number>(
    lease?.property_id ?? defaultPropertyId ?? 0
  );
  const [tenantName, setTenantName] = useState(lease?.tenant_name ?? '');
  const [tenantPhone, setTenantPhone] = useState(lease?.tenant_phone ?? '');
  const [tenantEmail, setTenantEmail] = useState(lease?.tenant_email ?? '');
  const [tenantDocument, setTenantDocument] = useState(lease?.tenant_document ?? '');
  const [ownerName, setOwnerName] = useState(lease?.owner_name ?? '');
  const [ownerPhone, setOwnerPhone] = useState(lease?.owner_phone ?? '');
  const [ownerEmail, setOwnerEmail] = useState(lease?.owner_email ?? '');
  const [ownerDocument, setOwnerDocument] = useState(lease?.owner_document ?? '');
  const [rent, setRent] = useState(lease ? String(lease.rent_cop) : '');
  const [building, setBuilding] = useState(lease ? String(lease.building_fee_cop) : '0');
  const [agencyMode, setAgencyMode] = useState<AgencyMode>(lease?.agency_mode ?? 'percent');
  const [agencyValue, setAgencyValue] = useState(lease ? String(lease.agency_value) : '10');
  const [paymentDay, setPaymentDay] = useState(lease ? String(lease.payment_day) : '1');
  const [startDate, setStartDate] = useState(lease?.start_date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(lease?.end_date ?? '');
  const [notes, setNotes] = useState(lease?.notes ?? '');
  const [concepts, setConcepts] = useState<ConceptRow[]>(
    (lease?.concepts ?? []).map((concept) => ({
      name: concept.name,
      amount_cop: String(concept.amount_cop),
      charge_tenant: concept.charge_tenant,
      deduct_owner: concept.deduct_owner,
      active: concept.active,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectProperty = (id: number) => {
    setPropertyId(id);
    const property = properties.find((item) => item.id === id);
    if (!property || isEdit) return;
    setOwnerName((prev) => prev || property.owner_name);
    setOwnerPhone((prev) => prev || property.owner_phone);
    setOwnerEmail((prev) => prev || property.owner_email);
    setRent((prev) => prev || String(property.price_cop));
  };

  const totals = useMemo(
    () =>
      periodTotals(
        {
          rent_cop: Number(rent) || 0,
          building_fee_cop: Number(building) || 0,
          agency_mode: agencyMode,
          agency_value: Number(agencyValue) || 0,
        },
        concepts.map((concept) => ({
          amount_cop: Number(concept.amount_cop) || 0,
          charge_tenant: concept.charge_tenant,
          deduct_owner: concept.deduct_owner,
          active: concept.active,
        }))
      ),
    [rent, building, agencyMode, agencyValue, concepts]
  );

  const updateConcept = (index: number, patch: Partial<ConceptRow>) => {
    setConcepts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!propertyId) {
      setError(t('selectPropertyError'));
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      property_id: propertyId,
      tenant_name: tenantName,
      tenant_phone: tenantPhone,
      tenant_email: tenantEmail,
      tenant_document: tenantDocument,
      owner_name: ownerName,
      owner_phone: ownerPhone,
      owner_email: ownerEmail,
      owner_document: ownerDocument,
      rent_cop: Number(rent) || 0,
      building_fee_cop: Number(building) || 0,
      agency_mode: agencyMode,
      agency_value: Number(agencyValue) || 0,
      payment_day: Number(paymentDay) || 1,
      start_date: startDate,
      end_date: endDate || null,
      notes,
      concepts: concepts
        .filter((concept) => concept.name.trim())
        .map((concept) => ({
          name: concept.name,
          amount_cop: Number(concept.amount_cop) || 0,
          charge_tenant: concept.charge_tenant,
          deduct_owner: concept.deduct_owner,
          active: concept.active,
        })),
    };

    try {
      const response = await fetch(
        isEdit ? `/api/admin/arriendos/${lease!.id}` : '/api/admin/arriendos',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error ?? 'save-failed');

      if (isEdit) {
        router.refresh();
      } else {
        router.push(`/admin/arriendos/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ajin-primary">{t('propertySection')}</h2>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ajin-text">{t('property')}</label>
          <select
            value={propertyId}
            onChange={(event) => selectProperty(Number(event.target.value))}
            className={input}
            required
          >
            <option value={0} disabled>
              {t('selectProperty')}
            </option>
            {properties.map((property) => (
              <option
                key={property.id}
                value={property.id}
                disabled={Boolean(property.active_lease_id) && property.id !== lease?.property_id}
              >
                #{property.id} · {property.title} — {property.city}
                {property.active_lease_id && property.id !== lease?.property_id
                  ? ` (${t('propertyLeased')})`
                  : ''}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-ajin-primary">{t('tenantSection')}</h2>
          <div className="space-y-3">
            <input
              className={input}
              placeholder={t('tenantName')}
              value={tenantName}
              onChange={(event) => setTenantName(event.target.value)}
              required
              maxLength={120}
            />
            <input
              className={input}
              placeholder={t('tenantPhone')}
              value={tenantPhone}
              onChange={(event) => setTenantPhone(event.target.value)}
              required
              maxLength={30}
            />
            <input
              type="email"
              className={input}
              placeholder={t('tenantEmail')}
              value={tenantEmail}
              onChange={(event) => setTenantEmail(event.target.value)}
              maxLength={160}
            />
            <input
              className={input}
              placeholder={t('tenantDocument')}
              value={tenantDocument}
              onChange={(event) => setTenantDocument(event.target.value)}
              maxLength={40}
            />
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold text-ajin-primary">{t('ownerSection')}</h2>
          <div className="space-y-3">
            <input
              className={input}
              placeholder={t('ownerName')}
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              required
              maxLength={120}
            />
            <input
              className={input}
              placeholder={t('ownerPhone')}
              value={ownerPhone}
              onChange={(event) => setOwnerPhone(event.target.value)}
              required
              maxLength={30}
            />
            <input
              type="email"
              className={input}
              placeholder={t('ownerEmail')}
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              maxLength={160}
            />
            <input
              className={input}
              placeholder={t('ownerDocument')}
              value={ownerDocument}
              onChange={(event) => setOwnerDocument(event.target.value)}
              maxLength={40}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ajin-primary">{t('amountsSection')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ajin-text">{t('rent')}</span>
            <input
              type="number"
              min={1}
              className={input}
              value={rent}
              onChange={(event) => setRent(event.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ajin-text">{t('buildingFee')}</span>
            <input
              type="number"
              min={0}
              className={input}
              value={building}
              onChange={(event) => setBuilding(event.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ajin-text">{t('paymentDay')}</span>
            <input
              type="number"
              min={1}
              max={28}
              className={input}
              value={paymentDay}
              onChange={(event) => setPaymentDay(event.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ajin-text">{t('agencyMode')}</span>
            <select
              className={input}
              value={agencyMode}
              onChange={(event) => setAgencyMode(event.target.value as AgencyMode)}
            >
              <option value="percent">{t('agencyModePercent')}</option>
              <option value="fixed">{t('agencyModeFixed')}</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ajin-text">
              {agencyMode === 'percent' ? t('agencyPercent') : t('agencyFixed')}
            </span>
            <input
              type="number"
              min={0}
              step={agencyMode === 'percent' ? '0.01' : '1'}
              className={input}
              value={agencyValue}
              onChange={(event) => setAgencyValue(event.target.value)}
              required
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 rounded-xl bg-ajin-surface/60 p-4 text-sm sm:grid-cols-3">
          <p>
            <span className="block text-xs uppercase tracking-wide text-ajin-gray-400">
              {t('previewAgency')}
            </span>
            <strong className="text-ajin-primary">{money(totals.agency)}</strong>
          </p>
          <p>
            <span className="block text-xs uppercase tracking-wide text-ajin-gray-400">
              {t('previewDue')}
            </span>
            <strong className="text-ajin-primary">{money(totals.totalDue)}</strong>
          </p>
          <p>
            <span className="block text-xs uppercase tracking-wide text-ajin-gray-400">
              {t('previewPayout')}
            </span>
            <strong className="text-ajin-primary">{money(totals.ownerPayout)}</strong>
          </p>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ajin-primary">{t('conceptsSection')}</h2>
          <button
            type="button"
            onClick={() =>
              setConcepts((prev) => [
                ...prev,
                { name: '', amount_cop: '0', charge_tenant: true, deduct_owner: false, active: true },
              ])
            }
            className="inline-flex items-center gap-1 rounded-lg bg-ajin-surface px-3 py-1.5 text-sm font-medium text-ajin-primary"
          >
            <Plus size={14} /> {t('addConcept')}
          </button>
        </div>
        <p className="mt-1 text-xs text-ajin-gray-400">{t('conceptsHint')}</p>

        {concepts.length > 0 && (
          <div className="mt-4 space-y-3">
            {concepts.map((concept, index) => (
              <div
                key={index}
                className="grid items-center gap-2 rounded-xl border border-ajin-border p-3 sm:grid-cols-[1fr_140px_auto_auto_auto]"
              >
                <input
                  className={input}
                  placeholder={t('conceptName')}
                  value={concept.name}
                  onChange={(event) => updateConcept(index, { name: event.target.value })}
                  maxLength={80}
                />
                <input
                  type="number"
                  min={0}
                  className={input}
                  placeholder={t('conceptAmount')}
                  value={concept.amount_cop}
                  onChange={(event) => updateConcept(index, { amount_cop: event.target.value })}
                />
                <label className="flex items-center gap-1 text-xs text-ajin-gray-300">
                  <input
                    type="checkbox"
                    checked={concept.charge_tenant}
                    onChange={(event) =>
                      updateConcept(index, { charge_tenant: event.target.checked })
                    }
                  />
                  {t('chargeTenant')}
                </label>
                <label className="flex items-center gap-1 text-xs text-ajin-gray-300">
                  <input
                    type="checkbox"
                    checked={concept.deduct_owner}
                    onChange={(event) =>
                      updateConcept(index, { deduct_owner: event.target.checked })
                    }
                  />
                  {t('deductOwner')}
                </label>
                <button
                  type="button"
                  onClick={() => setConcepts((prev) => prev.filter((_, i) => i !== index))}
                  className="justify-self-end rounded-lg p-2 text-red-500 hover:bg-red-50"
                  aria-label={t('removeConcept')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-ajin-primary">{t('datesSection')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ajin-text">{t('startDate')}</span>
            <input
              type="date"
              className={input}
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ajin-text">{t('endDate')}</span>
            <input
              type="date"
              className={input}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <p className="text-sm text-ajin-gray-300">
            <span className="mb-1 block font-semibold text-ajin-text">{t('reminderRuleTitle')}</span>
            {t('reminderRule')}
          </p>
        </div>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-semibold text-ajin-text">{t('notes')}</span>
          <textarea
            className={`${input} min-h-20`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={2000}
          />
        </label>
      </section>

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} /> {error}
        </p>
      )}

      <Button type="submit" disabled={saving}>
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" /> {t('saving')}
          </>
        ) : (
          t('save')
        )}
      </Button>
    </form>
  );
}
