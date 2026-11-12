import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { redirect, Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSessionAuth, hasPermission } from '@/lib/permissions';
import { fetchLeaseDetail, fetchPropertiesForLease } from '@/lib/supabase/leases';
import LeaseManager from '@/components/admin/LeaseManager';
import LeaseForm from '@/components/admin/LeaseForm';

export const dynamic = 'force-dynamic';

export default async function AdminLeasePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const auth = await getSessionAuth();
  if (!hasPermission(auth, 'leases.manage')) {
    redirect({ href: '/admin', locale });
  }

  const leaseId = Number(id);
  if (!Number.isInteger(leaseId) || leaseId <= 0) notFound();

  const lease = await fetchLeaseDetail(leaseId);
  if (!lease) notFound();

  const t = await getTranslations({ locale, namespace: 'admin.leases' });
  const properties = await fetchPropertiesForLease();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <Link
        href="/admin/arriendos"
        className="inline-flex items-center gap-2 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-accent"
      >
        <ArrowLeft size={16} /> {t('backToList')}
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-ajin-primary">
          #{lease.id} · {lease.property?.title ?? `Property ${lease.property_id}`}
        </h1>
        <span className="text-sm text-ajin-gray-300">
          {lease.tenant_name} · {lease.tenant_phone}
        </span>
      </div>

      <div className="mt-6">
        <LeaseManager
          lease={lease}
          today={today}
          locale={locale === 'en' ? 'en' : 'es'}
          canFinance={hasPermission(auth, 'leases.finance')}
        />
      </div>

      <details className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-ajin-primary">
          {t('editContract')}
        </summary>
        <p className="mt-1 text-xs text-ajin-gray-400">{t('editContractHint')}</p>
        <div className="mt-5">
          <LeaseForm properties={properties} lease={lease} />
        </div>
      </details>
    </div>
  );
}
