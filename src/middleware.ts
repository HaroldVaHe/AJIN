import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
});

function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

/**
 * Guard del panel: exige sesión, pero no decide el rol.
 * El rol y los permisos se resuelven en el layout `admin/(guarded)` y en
 * cada ruta /api/admin/*, porque viven en la base de datos (user_roles) y
 * no se pueden consultar aquí sin añadir latencia a cada request.
 */
async function handleAdminGuard(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = pathname.split('/')[1] || 'es';
  const isLoginPage = /^\/(es|en)\/admin\/login$/.test(pathname);

  if (!supabaseConfigured()) {
    if (isLoginPage) return NextResponse.next({ request });
    return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url), 302);
  }

  try {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // La página de login decide si redirige (sesión con rol) o muestra el
    // formulario, así un usuario autenticado sin rol no cae en un bucle.
    if (isLoginPage) return response;

    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url), 302);
    }

    return response;
  } catch (e) {
    console.error('Admin guard failed, failing closed:', e);
    if (isLoginPage) return NextResponse.next({ request });
    return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url), 302);
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  try {
    if (/^\/(es|en)\/admin(\/|$)/.test(pathname)) {
      return await handleAdminGuard(request);
    }
  } catch (e) {
    console.error('Middleware error:', e);
  }

  // next-intl redirige `/` al locale correspondiente usando la ruta actual
  // (antes se redirigía a NEXT_PUBLIC_SITE_URL, lo que sacaba del entorno local).
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
