import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
});

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function handleAdminGuard(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = pathname.split('/')[1] || 'es';
  const isLoginPage = /^\/(es|en)\/admin\/login$/.test(pathname);

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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

  const email = user?.email?.toLowerCase() ?? null;
  const isAdmin = email !== null && ADMIN_EMAILS.includes(email);

  if (isLoginPage) {
    if (isAdmin) return NextResponse.redirect(new URL(`/${locale}/admin/inmuebles`, request.url), 302);
    return response;
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url), 302);
  }

  return response;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ajinabogados.online';
    return NextResponse.redirect(`${siteUrl}/es`, { status: 301 });
  }

  if (/^\/(es|en)\/admin(\/|$)/.test(pathname)) {
    return handleAdminGuard(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
