import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getSessionAuth, hasPermission } from '@/lib/permissions';
import { fetchRolesData } from '@/lib/supabase/leases';
import RolesManager from '@/components/admin/RolesManager';

export const dynamic = 'force-dynamic';

export default async function AdminRolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await getSessionAuth();
  if (!hasPermission(auth, 'roles.manage')) {
    redirect({ href: '/admin', locale });
  }

  const t = await getTranslations({ locale, namespace: 'admin.roles' });
  const { users, permissions } = await fetchRolesData();

  return (
    <div>
      <h1 className="text-2xl font-bold text-ajin-primary">{t('title')}</h1>
      <p className="mt-1 max-w-3xl text-sm text-ajin-gray-300">{t('subtitle')}</p>

      <div className="mt-6">
        <RolesManager
          users={users}
          permissionsByRole={permissions}
          currentEmail={auth.email}
        />
      </div>
    </div>
  );
}
