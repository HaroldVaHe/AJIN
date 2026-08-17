import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
});

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ajinabogados.online';
    return NextResponse.redirect(`${siteUrl}/es`, { status: 301 });
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
