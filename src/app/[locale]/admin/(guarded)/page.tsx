import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getSessionAuth, hasPermission } from '@/lib/permissions';

/**
 * Punto de entrada del panel: manda a la primera sección permitida.
 * Centralizar la decisión evita bucles cuando un rol no tiene un permiso.
 */
export default async function AdminIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await getSessionAuth();

  if (hasPermission(auth, 'properties.manage')) {
    redirect({ href: '/admin/inmuebles', locale });
    return null;
  }
  if (hasPermission(auth, 'leases.manage')) {
    redirect({ href: '/admin/arriendos', locale });
    return null;
  }
  if (hasPermission(auth, 'knowledge.view')) {
    redirect({ href: '/admin/cerebro', locale });
    return null;
  }
  if (hasPermission(auth, 'roles.manage')) {
    redirect({ href: '/admin/roles', locale });
    return null;
  }
  if (hasPermission(auth, 'audit.view')) {
    redirect({ href: '/admin/auditoria', locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: 'admin' });
  return (
    <p className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-ajin-gray-400 shadow-sm">
      {t('noPermissions')}
    </p>
  );
}

export const dynamic = 'force-dynamic';
