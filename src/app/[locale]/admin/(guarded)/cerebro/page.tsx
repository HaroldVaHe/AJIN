import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { getSessionAuth, hasPermission } from '@/lib/permissions';
import { getKnowledgeStatus } from '@/lib/knowledge/status';
import KnowledgeChat from '@/components/admin/KnowledgeChat';

export default async function CerebroPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await getSessionAuth();
  if (!hasPermission(auth, 'knowledge.view')) {
    redirect({ href: '/admin', locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: 'admin.cerebro' });
  const status = await getKnowledgeStatus();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="font-serif text-2xl font-semibold text-ajin-primary sm:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-ajin-gray-400">{t('subtitle')}</p>
      </header>
      <KnowledgeChat status={status} canSync={hasPermission(auth, 'knowledge.manage')} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
