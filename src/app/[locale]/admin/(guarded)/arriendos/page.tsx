import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { Plus } from 'lucide-react';
import { getSessionAuth, hasPermission } from '@/lib/permissions';
import { fetchLeaseList, fetchNextDueByLease } from '@/lib/supabase/leases';
import { reminderLabel } from '@/lib/leases';

export const dynamic = 'force-dynamic';

const money = (value: number) => `$${new Intl.NumberFormat('es-CO').format(value)}`;

export default async function AdminLeasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await getSessionAuth();
  if (!hasPermission(auth, 'leases.manage')) {
    redirect({ href: '/admin', locale });
  }

  const t = await getTranslations({ locale, namespace: 'admin.leases' });
  const leases = await fetchLeaseList();
  const nextDue = await fetchNextDueByLease(leases.map((lease) => lease.id));
  const today = new Date().toISOString().slice(0, 10);
  const localeTag = locale === 'en' ? 'en-US' : 'es-CO';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ajin-primary">{t('listTitle')}</h1>
          <p className="mt-1 text-sm text-ajin-gray-300">{t('listSubtitle')}</p>
        </div>
        <Link
          href="/admin/arriendos/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-ajin-accent px-4 py-2 text-sm font-semibold text-ajin-primary transition-colors hover:bg-ajin-accent-dark hover:text-white"
        >
          <Plus size={16} /> {t('newLease')}
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        {leases.length === 0 ? (
          <p className="px-6 py-16 text-center text-ajin-gray-400">{t('empty')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ajin-border bg-ajin-surface/50 text-xs uppercase tracking-wide text-ajin-gray-400">
                <th className="px-5 py-3 font-semibold">{t('table.property')}</th>
                <th className="px-5 py-3 font-semibold">{t('table.tenant')}</th>
                <th className="px-5 py-3 font-semibold">{t('table.rent')}</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">{t('table.nextDue')}</th>
                <th className="px-5 py-3 font-semibold">{t('table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((lease) => {
                const period = nextDue.get(lease.id) ?? null;
                const overdue = period ? period.due_date < today : false;
                return (
                  <tr key={lease.id} className="border-b border-ajin-border last:border-0">
                    <td className="max-w-xs px-5 py-3">
                      <Link
                        href={`/admin/arriendos/${lease.id}`}
                        className="line-clamp-1 font-medium text-ajin-text hover:text-ajin-accent"
                      >
                        #{lease.id} · {lease.property?.title ?? `Property ${lease.property_id}`}
                      </Link>
                      <span className="block text-xs text-ajin-gray-400">
                        {lease.property?.city ?? ''}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block text-ajin-text">{lease.tenant_name}</span>
                      <span className="block text-xs text-ajin-gray-400">{lease.tenant_phone}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-ajin-text">
                      {money(lease.rent_cop)}
                      <span className="block text-xs text-ajin-gray-400">
                        {lease.agency_mode === 'percent'
                          ? `${lease.agency_value}%`
                          : money(lease.agency_value)}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 lg:table-cell">
                      {period ? (
                        <>
                          <span className={overdue ? 'font-semibold text-red-600' : 'text-ajin-text'}>
                            {period.due_date}
                          </span>
                          <span className="block text-xs text-ajin-gray-400">
                            {money(period.total_due_cop - period.paid_cop)}
                          </span>
                        </>
                      ) : (
                        <span className="text-ajin-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          lease.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-ajin-surface text-ajin-gray-400'
                        }`}
                      >
                        {t(`status.${lease.status}`)}
                      </span>
                      {period && (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                            overdue && period.status !== 'paid'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-ajin-surface text-ajin-gray-300'
                          }`}
                        >
                          {reminderLabel(
                            overdue ? 3 : period.due_date === today ? 2 : 1,
                            locale === 'en' ? 'en' : 'es'
                          )}
                        </span>
                      )}
                      <span className="mt-1 block text-xs text-ajin-gray-400">
                        {new Date(`${lease.start_date}T00:00:00`).toLocaleDateString(localeTag)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
