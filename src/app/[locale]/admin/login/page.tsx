import { getTranslations } from 'next-intl/server';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  return (
    <section className="section-padding">
      <div className="container-ajin max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-ajin-primary">
          {t('loginTitle')}
        </h1>
        {supabaseUrl && supabaseAnonKey ? (
          <AdminLoginForm supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey} />
        ) : (
          <p className="mt-6 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700">
            Configuración de Supabase no disponible (SUPABASE_URL / SUPABASE_ANON_KEY).
          </p>
        )}
      </div>
    </section>
  );
}
