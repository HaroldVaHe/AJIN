import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import PropertyEditor from '@/components/admin/PropertyEditor';
import { fetchPropertyForAdmin } from '@/lib/supabase/admin-queries';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.editor' });
  const property = await fetchPropertyForAdmin(id);

  return (
    <div>
      <Link
        href="/admin/inmuebles"
        className="inline-flex items-center gap-2 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-accent"
      >
        <ArrowLeft size={16} /> {t('backToList')}
      </Link>
      <div className="mt-6">
        {property ? (
          <PropertyEditor property={property} />
        ) : (
          <p className="text-ajin-gray-400">{t('saveError')}</p>
        )}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
