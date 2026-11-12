import { getTranslations } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import PropertyEditor from '@/components/admin/PropertyEditor';
import { getSessionAuth, hasPermission } from '@/lib/permissions';

export default async function NewPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await getSessionAuth();
  if (!hasPermission(auth, 'properties.manage')) {
    redirect({ href: '/admin/arriendos', locale });
    return null;
  }
  const t = await getTranslations({ locale, namespace: 'admin.editor' });

  return (
    <div>
      <Link
        href="/admin/inmuebles"
        className="inline-flex items-center gap-2 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-accent"
      >
        <ArrowLeft size={16} /> {t('backToList')}
      </Link>
      <div className="mt-6">
        <PropertyEditor />
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
