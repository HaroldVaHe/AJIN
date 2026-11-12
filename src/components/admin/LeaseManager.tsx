'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileText, Loader2, Plus, Receipt, Trash2, Upload } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ALLOWED_RECEIPT_TYPES, periodTotals, reminderLabel } from '@/lib/leases';
import type { LeaseDetail, LeasePeriod, LeaseReceipt } from '@/types/lease';

interface LeaseManagerProps {
  lease: LeaseDetail;
  today: string;
  locale: 'es' | 'en';
  canFinance: boolean;
}

const input =
  'w-full rounded-xl border border-ajin-border px-3 py-2 text-sm focus:border-ajin-accent focus:outline-none';

const money = (value: number) => `$${new Intl.NumberFormat('es-CO').format(Math.round(value))}`;

export default function LeaseManager({ lease, today, locale, canFinance }: LeaseManagerProps) {
  const router = useRouter();
  const t = useTranslations('admin.leases.manager');
  const totals = periodTotals(lease, lease.concepts);
  const base = `/api/admin/arriendos/${lease.id}`;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState('invoice');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [uploading, setUploading] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('actionError'));
    } finally {
      setBusy(false);
    }
  };

  const generateMonths = () =>
    run(async () => {
      const response = await fetch(`${base}/periodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error('generate-failed');
    });

  const setLeaseStatus = (status: 'active' | 'finished') =>
    run(async () => {
      const response = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('status-failed');
    });

  const removeLease = () => {
    if (!window.confirm(t('deleteConfirm'))) return;
    void run(async () => {
      const response = await fetch(base, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete-failed');
      router.push('/admin/arriendos');
    });
  };

  const uploadReceipt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      setError(t('invalidFile'));
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError(t('invalidFile'));
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('kind', kind);
      form.append('label', label);
      if (amount) form.append('amount_cop', amount);
      if (periodId) form.append('period_id', periodId);
      const response = await fetch(`${base}/recibos`, { method: 'POST', body: form });
      if (!response.ok) throw new Error('upload-failed');
      setFile(null);
      setLabel('');
      setAmount('');
      setPeriodId('');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(t('uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const deleteReceipt = (receipt: LeaseReceipt) => {
    if (!window.confirm(t('deleteReceiptConfirm'))) return;
    void run(async () => {
      const response = await fetch(`${base}/recibos/${receipt.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete-receipt-failed');
    });
  };

  const receiptsByPeriod = (id: number) => lease.receipts.filter((r) => r.period_id === id);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <Stat label={t('summary.rent')} value={money(lease.rent_cop)} />
        <Stat label={t('summary.building')} value={money(lease.building_fee_cop)} />
        <Stat label={t('summary.agency')} value={money(totals.agency)} />
        <Stat label={t('summary.monthly')} value={money(totals.totalDue)} highlight />
        <Stat label={t('summary.payout')} value={money(totals.ownerPayout)} highlight />
        <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap items-center gap-3 border-t border-ajin-border pt-3 text-xs text-ajin-gray-400">
          <span>
            {t('startDate')}: <strong className="text-ajin-text">{lease.start_date}</strong>
          </span>
          {lease.end_date && (
            <span>
              {t('endDate')}: <strong className="text-ajin-text">{lease.end_date}</strong>
            </span>
          )}
          <span>
            {t('paymentDay')}: <strong className="text-ajin-text">{lease.payment_day}</strong>
          </span>
          <span>
            {t('reminders')}: <strong className="text-ajin-text">{lease.reminder_days.join(', ')}</strong>
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              lease.status === 'active'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-ajin-surface text-ajin-gray-400'
            }`}
          >
            {t(`leaseStatus.${lease.status}`)}
          </span>
        </div>
      </section>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ajin-primary">{t('periodsTitle')}</h2>
            <p className="text-xs text-ajin-gray-400">{t('periodsHint')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generateMonths}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-xl bg-ajin-surface px-3 py-2 text-sm font-medium text-ajin-primary disabled:opacity-50"
            >
              <Plus size={14} /> {t('generateMonths')}
            </button>
            <button
              type="button"
              onClick={() => setLeaseStatus(lease.status === 'active' ? 'finished' : 'active')}
              disabled={busy}
              className="rounded-xl border border-ajin-border px-3 py-2 text-sm font-medium text-ajin-gray-300 disabled:opacity-50"
            >
              {lease.status === 'active' ? t('finishLease') : t('reactivateLease')}
            </button>
            <button
              type="button"
              onClick={removeLease}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
            >
              <Trash2 size={14} /> {t('deleteLease')}
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ajin-border text-xs uppercase tracking-wide text-ajin-gray-400">
                <th className="px-2 py-2 font-semibold">{t('table.period')}</th>
                <th className="px-2 py-2 font-semibold">{t('table.dueDate')}</th>
                <th className="px-2 py-2 font-semibold">{t('table.total')}</th>
                <th className="px-2 py-2 font-semibold">{t('table.paid')}</th>
                <th className="px-2 py-2 font-semibold">{t('table.payout')}</th>
                <th className="px-2 py-2 font-semibold">{t('table.status')}</th>
                <th className="px-2 py-2 text-right font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {lease.periods.map((period) => (
                <PeriodRow
                  key={period.id}
                  period={period}
                  today={today}
                  locale={locale}
                  canFinance={canFinance}
                  receipts={receiptsByPeriod(period.id)}
                  onSaved={() => router.refresh()}
                  onError={setError}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ajin-primary">
          <Receipt size={18} /> {t('receiptsTitle')}
        </h2>
        <p className="text-xs text-ajin-gray-400">{t('receiptsHint')}</p>

        <form onSubmit={uploadReceipt} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className={`${input} lg:col-span-2`}
            required
          />
          <select className={input} value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="invoice">{t('kinds.invoice')}</option>
            <option value="payment">{t('kinds.payment')}</option>
            <option value="building">{t('kinds.building')}</option>
            <option value="utility">{t('kinds.utility')}</option>
            <option value="payout">{t('kinds.payout')}</option>
            <option value="other">{t('kinds.other')}</option>
          </select>
          <input
            className={input}
            placeholder={t('label')}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={120}
          />
          <input
            type="number"
            min={0}
            className={input}
            placeholder={t('amount')}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <select
            className={input}
            value={periodId}
            onChange={(event) => setPeriodId(event.target.value)}
          >
            <option value="">{t('noPeriod')}</option>
            {lease.periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.period}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2 lg:col-span-6">
            <Button type="submit" disabled={uploading || !file}>
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {t('uploading')}
                </>
              ) : (
                <>
                  <Upload size={16} /> {t('upload')}
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-5 space-y-2">
          {lease.receipts.length === 0 ? (
            <p className="text-sm text-ajin-gray-400">{t('noReceipts')}</p>
          ) : (
            lease.receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ajin-border px-3 py-2 text-sm"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText size={16} className="shrink-0 text-ajin-accent" />
                  <span className="truncate text-ajin-text">
                    {receipt.label || t(`kinds.${receipt.kind}`)}
                  </span>
                  <span className="text-xs text-ajin-gray-400">
                    {receipt.amount_cop ? money(receipt.amount_cop) : ''}
                  </span>
                  {receipt.period_id && (
                    <span className="rounded-full bg-ajin-surface px-2 py-0.5 text-xs text-ajin-gray-300">
                      {lease.periods.find((p) => p.id === receipt.period_id)?.period ?? ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {receipt.signed_url ? (
                    <a
                      href={receipt.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-ajin-accent hover:underline"
                    >
                      {t('view')}
                    </a>
                  ) : (
                    <span className="text-xs text-ajin-gray-400">{t('linkExpired')}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteReceipt(receipt)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                    aria-label={t('deleteReceipt')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="block text-[11px] uppercase tracking-wide text-ajin-gray-400">{label}</span>
      <strong className={highlight ? 'text-lg text-ajin-accent-dark' : 'text-ajin-primary'}>
        {value}
      </strong>
    </div>
  );
}

interface PeriodRowProps {
  period: LeasePeriod;
  today: string;
  locale: 'es' | 'en';
  canFinance: boolean;
  receipts: LeaseReceipt[];
  onSaved: () => void;
  onError: (message: string) => void;
}

function PeriodRow({
  period,
  today,
  locale,
  canFinance,
  receipts,
  onSaved,
  onError,
}: PeriodRowProps) {
  const t = useTranslations('admin.leases.manager');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paid, setPaid] = useState(String(period.paid_cop));
  const [paidAt, setPaidAt] = useState(period.paid_at ?? '');
  const [payoutAt, setPayoutAt] = useState(period.payout_paid_at ?? '');
  const [notes, setNotes] = useState(period.notes);
  const overdue = period.status !== 'paid' && period.due_date < today;
  const pending = Math.max(0, period.total_due_cop - period.paid_cop);

  // Mantiene el formulario en sincronía cuando router.refresh() trae nuevos datos.
  useEffect(() => {
    setPaid(String(period.paid_cop));
    setPaidAt(period.paid_at ?? '');
    setPayoutAt(period.payout_paid_at ?? '');
    setNotes(period.notes);
  }, [period.paid_cop, period.paid_at, period.payout_paid_at, period.notes]);

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/arriendos/${period.lease_id}/periodos/${period.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) throw new Error('patch-failed');
      onSaved();
      setOpen(false);
    } catch (err) {
      console.error(err);
      onError(t('actionError'));
    } finally {
      setSaving(false);
    }
  };

  const markPaid = () =>
    patch({ paid_cop: period.total_due_cop, paid_at: today });

  const saveDetails = () =>
    patch({
      paid_cop: Number(paid) || 0,
      paid_at: paidAt || null,
      payout_paid_at: payoutAt || null,
      notes,
    });

  return (
    <>
      <tr className="border-b border-ajin-border last:border-0">
        <td className="px-2 py-2 font-medium text-ajin-text">{period.period}</td>
        <td className={`px-2 py-2 ${overdue ? 'font-semibold text-red-600' : 'text-ajin-gray-300'}`}>
          {period.due_date}
        </td>
        <td className="px-2 py-2 text-ajin-text">{money(period.total_due_cop)}</td>
        <td className="px-2 py-2 text-ajin-text">
          {money(period.paid_cop)}
          {pending > 0 && period.paid_cop > 0 && (
            <span className="block text-xs text-amber-600">{money(pending)}</span>
          )}
        </td>
        <td className="px-2 py-2">
          <span className="text-ajin-text">{money(period.owner_payout_cop)}</span>
          <span className="block text-xs text-ajin-gray-400">
            {period.payout_paid_at ? t('paidOut') : t('payoutPending')}
          </span>
        </td>
        <td className="px-2 py-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              period.status === 'paid'
                ? 'bg-emerald-50 text-emerald-700'
                : overdue
                  ? 'bg-red-50 text-red-600'
                  : period.status === 'partial'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-ajin-surface text-ajin-gray-400'
            }`}
          >
            {t(`periodStatus.${overdue ? 'overdue' : period.status}`)}
          </span>
          {period.reminder_stage > 0 && (
            <span className="mt-1 block text-[11px] text-ajin-gray-400">
              {reminderLabel(period.reminder_stage as 0 | 1 | 2 | 3, locale)}
            </span>
          )}
          {receipts.length > 0 && (
            <span className="mt-1 block text-[11px] text-ajin-gray-400">
              {t('receiptsCount', { count: receipts.length })}
            </span>
          )}
        </td>
        <td className="px-2 py-2 text-right">
          {canFinance && (
            <div className="flex flex-wrap justify-end gap-2">
              {period.status !== 'paid' && (
                <button
                  type="button"
                  onClick={markPaid}
                  disabled={saving}
                  className="rounded-lg bg-ajin-accent px-2.5 py-1 text-xs font-semibold text-ajin-primary disabled:opacity-50"
                >
                  {t('markPaid')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="rounded-lg bg-ajin-surface px-2.5 py-1 text-xs font-medium text-ajin-primary"
              >
                {open ? t('close') : t('edit')}
              </button>
            </div>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-ajin-border bg-ajin-surface/40">
          <td colSpan={7} className="px-3 py-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="text-xs">
                <span className="mb-1 block font-semibold text-ajin-text">{t('paidAmount')}</span>
                <input
                  type="number"
                  min={0}
                  className={input}
                  value={paid}
                  onChange={(event) => setPaid(event.target.value)}
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-semibold text-ajin-text">{t('paidAt')}</span>
                <input
                  type="date"
                  className={input}
                  value={paidAt}
                  onChange={(event) => setPaidAt(event.target.value)}
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-semibold text-ajin-text">{t('payoutAt')}</span>
                <input
                  type="date"
                  className={input}
                  value={payoutAt}
                  onChange={(event) => setPayoutAt(event.target.value)}
                />
              </label>
              <label className="text-xs sm:col-span-2">
                <span className="mb-1 block font-semibold text-ajin-text">{t('notes')}</span>
                <input
                  className={input}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  maxLength={1000}
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveDetails}
                disabled={saving}
                className="rounded-lg bg-ajin-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {saving ? t('saving') : t('save')}
              </button>
              {period.owner_payout_cop > 0 && (
                <button
                  type="button"
                  onClick={() => patch({ payout_paid_at: payoutAt || today })}
                  disabled={saving || Boolean(period.payout_paid_at)}
                  className="rounded-lg border border-ajin-border px-3 py-1.5 text-xs font-medium text-ajin-primary disabled:opacity-40"
                >
                  {t('markPayout')}
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
