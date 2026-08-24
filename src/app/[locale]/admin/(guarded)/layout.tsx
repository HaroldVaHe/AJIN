import { getTranslations } from 'next-intl/server';
import AdminUserBar from '@/components/admin/AdminUserBar';

export default async function AdminGuardedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  return (
    <div className="min-h-[70vh]">
      <AdminUserBar
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
        title={t('listTitle')}
      />
      <div className="section-padding">
        <div className="container-ajin">{children}</div>
      </div>
    </div>
  );
}
