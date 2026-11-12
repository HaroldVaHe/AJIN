import { getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSessionAuth } from '@/lib/permissions';
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

  // Defensa en profundidad: el middleware ya exige sesión, pero el layout
  // vuelve a comprobar el rol porque estas páginas leen con la service-role key.
  if (!supabaseUrl || !supabaseAnonKey) {
    redirect({ href: '/admin/login', locale });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/admin/login', locale });
  }

  const auth = await getSessionAuth();
  const role = auth.role;
  if (!role) {
    // Usuario autenticado sin rol asignado: no debe ver el panel.
    redirect({ href: '/admin/login', locale });
    return null;
  }

  return (
    <div className="min-h-[70vh]">
      <AdminUserBar
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
        title={t('panelTitle')}
        role={role}
        permissions={auth.permissions}
      />
      <div className="section-padding">
        <div className="container-ajin">{children}</div>
      </div>
    </div>
  );
}
