'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';

const navItems = [
  { href: '/', key: 'common.nav.home' },
  { href: '/nosotros', key: 'common.nav.about' },
  { href: '/servicios', key: 'common.nav.services' },
  { href: '/blog', key: 'common.nav.blog' },
  { href: '/poderes', key: 'common.nav.powers' },
  { href: '/contacto', key: 'common.nav.contact' },
] as const;

const languages = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations();
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-ajin-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="container-ajin flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-ajin-black">AJ</span>
            <span className="text-ajin-green">IN</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive
                    ? 'text-ajin-green'
                    : 'text-ajin-gray-600 hover:text-ajin-black'
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
          <div className="flex items-center gap-1 ml-4 border-l border-ajin-gray-200 pl-4">
            {languages.map((lang) => (
              <Link
                key={lang.code}
                href={pathname}
                locale={lang.code}
                className={cn(
                  'px-2 py-1 text-xs font-semibold rounded-md transition-colors',
                  locale === lang.code
                    ? 'bg-ajin-green text-black'
                    : 'text-ajin-gray-400 hover:text-ajin-black'
                )}
              >
                {lang.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/contacto">
            <Button variant="primary" size="sm" className="hidden md:inline-flex">
              {t('common.schedule')}
            </Button>
          </Link>
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-white/95 backdrop-blur-sm md:hidden">
          <nav className="flex flex-col p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'px-4 py-4 text-lg font-medium transition-colors border-b border-ajin-gray-100 last:border-b-0',
                    isActive
                      ? 'bg-ajin-green/10 text-ajin-green'
                      : 'bg-ajin-gray-50 text-ajin-gray-600'
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
            <div className="flex gap-2 mt-4 pt-4 border-t border-ajin-gray-100">
              {languages.map((lang) => (
                <Link
                  key={lang.code}
                  href={pathname}
                  locale={lang.code}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors',
                    locale === lang.code
                      ? 'bg-ajin-green text-black'
                      : 'bg-ajin-gray-50 text-ajin-gray-600'
                  )}
                >
                  {lang.label}
                </Link>
              ))}
            </div>
            <Link href="/contacto" onClick={() => setMobileOpen(false)}>
              <Button variant="primary" className="w-full mt-4">
                {t('common.schedule')}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
