import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { getSessionAuth } from '@/lib/permissions';

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  const configured = Boolean(supabaseUrl && supabaseAnonKey);
  if (configured) {
    // Solo se redirige si la sesión tiene rol: un usuario autenticado sin
    // acceso debe poder ver el formulario (y el mensaje de "sin permisos").
    const auth = await getSessionAuth();
    if (auth.role) {
      redirect({ href: '/admin', locale });
    }
  }

  return (
    <section className="section-padding">
      <div className="container-ajin max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-ajin-primary">
          {t('loginTitle')}
        </h1>
        {configured ? (
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
