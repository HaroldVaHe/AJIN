import { getTranslations } from 'next-intl/server';
import { redirect, Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSessionAuth, hasPermission } from '@/lib/permissions';
import { fetchPropertiesForLease } from '@/lib/supabase/leases';
import LeaseForm from '@/components/admin/LeaseForm';

export const dynamic = 'force-dynamic';

export default async function NewLeasePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ property?: string }>;
}) {
  const { locale } = await params;
  const { property } = await searchParams;
  const auth = await getSessionAuth();
  if (!hasPermission(auth, 'leases.manage')) {
    redirect({ href: '/admin', locale });
  }

  const t = await getTranslations({ locale, namespace: 'admin.leases' });
  const properties = await fetchPropertiesForLease();
  const requested = Number(property);
  const defaultPropertyId =
    Number.isInteger(requested) && properties.some((p) => p.id === requested) ? requested : null;

  return (
    <div>
      <Link
        href="/admin/arriendos"
        className="inline-flex items-center gap-2 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-accent"
      >
        <ArrowLeft size={16} /> {t('backToList')}
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-ajin-primary">{t('newTitle')}</h1>
      <p className="mt-1 text-sm text-ajin-gray-300">{t('newSubtitle')}</p>

      <div className="mt-6">
        <LeaseForm properties={properties} defaultPropertyId={defaultPropertyId} />
      </div>
    </div>
  );
}
