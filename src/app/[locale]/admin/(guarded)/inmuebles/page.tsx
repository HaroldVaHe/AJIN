import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Plus } from 'lucide-react';
import {
  fetchAllPropertiesForAdmin,
  countPropertyImages,
} from '@/lib/supabase/admin-queries';
import type { PropertyStatus } from '@/types/property';
import AdminRowActions from '@/components/admin/AdminRowActions';

const TABS: PropertyStatus[] = ['pending', 'approved', 'rejected'];

export default async function AdminPropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ estado?: string }>;
}) {
  const { locale } = await params;
  const { estado } = await searchParams;
  const activeTab = TABS.includes(estado as PropertyStatus)
    ? (estado as PropertyStatus)
    : 'pending';

  const t = await getTranslations({ locale, namespace: 'admin' });
  const properties = await fetchAllPropertiesForAdmin(activeTab);
  const photoCounts = await countPropertyImages(properties.map((p) => p.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ajin-primary">{t('listTitle')}</h1>
        <Link
          href="/admin/inmuebles/nuevo"
          className="inline-flex items-center gap-2 rounded-xl bg-ajin-accent px-4 py-2 text-sm font-semibold text-ajin-primary transition-colors hover:bg-ajin-accent-dark hover:text-white"
        >
          <Plus size={16} /> {t('newProperty')}
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={`/admin/inmuebles?estado=${tab}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === activeTab
                ? 'bg-ajin-primary text-white'
                : 'bg-white text-ajin-gray-300 hover:bg-ajin-surface'
            }`}
          >
            {t(`tabs.${tab}`)}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
        {properties.length === 0 ? (
          <p className="px-6 py-16 text-center text-ajin-gray-400">{t('emptyState')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ajin-border bg-ajin-surface/50 text-xs uppercase tracking-wide text-ajin-gray-400">
                <th className="px-5 py-3 font-semibold">{t('table.title')}</th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">
                  {t('table.operation')}
                </th>
                <th className="px-5 py-3 font-semibold">{t('table.price')}</th>
                <th className="hidden px-5 py-3 font-semibold lg:table-cell">
                  {t('table.photos')}
                </th>
                <th className="hidden px-5 py-3 font-semibold md:table-cell">{t('table.date')}</th>
                <th className="px-5 py-3 text-right font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-b border-ajin-border last:border-0">
                  <td className="max-w-xs px-5 py-3">
                    <span className="line-clamp-1 font-medium text-ajin-text">
                      #{property.id} · {property.title}
                    </span>
                  </td>
                  <td className="hidden px-5 py-3 capitalize text-ajin-gray-300 md:table-cell">
                    {property.operation}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-ajin-text">
                    ${new Intl.NumberFormat('es-CO').format(property.price_cop)}
                  </td>
                  <td className="hidden px-5 py-3 text-ajin-gray-300 lg:table-cell">
                    {photoCounts.get(property.id) ?? 0}/15
                  </td>
                  <td className="hidden whitespace-nowrap px-5 py-3 text-ajin-gray-400 md:table-cell">
                    {new Date(property.created_at).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-5 py-3">
                    <AdminRowActions
                      propertyId={property.id}
                      status={property.status}
                      deleteConfirm={t('deleteConfirm')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
