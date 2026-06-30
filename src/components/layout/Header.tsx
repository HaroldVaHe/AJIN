'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

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

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ajin-gray-700 bg-ajin-primary">
        {/* Usamos un grid personalizado en pantallas de escritorio (md:):
    - Lado izquierdo (Logo): Toma 1 fracción del espacio sobrante
    - Centro (Nav): Toma solo el espacio que su contenido necesita (auto)
    - Lado derecho (Botones): Toma 1 fracción del espacio sobrante
    Al medir '1fr' ambos extremos, el centro se mantiene matemáticamente en el eje central.
  */}
        <div className="container-ajin flex md:grid md:grid-cols-[1fr_auto_1fr] h-16 items-center justify-between md:justify-normal gap-x-[clamp(1.5rem,3.5vw,6rem)] px-[clamp(1.5rem,9vw,10rem)]">

          {/* Columna 1: Logo (Alineado a la izquierda) */}
          <div className="flex items-center justify-start">
            <Link href="/" className="flex items-center">
              <Logo className="w-12 h-12" />
            </Link>
          </div>

          {/* Columna 2: Navegación (Centrada y con su tamaño natural) */}
          <nav className="hidden md:flex items-center justify-center gap-[clamp(1.5rem,3.5vw,5rem)] px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium whitespace-nowrap transition-colors', // whitespace-nowrap evita saltos de línea indeseados
                    isActive
                      ? 'text-ajin-accent'
                      : 'text-ajin-gray-400 hover:text-white'
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          {/* Columna 3: Idiomas y Botón (Alineado a la derecha) */}
          <div className="flex items-center justify-end gap-[clamp(1rem,2.5vw,4rem)]">
            {/* Idiomas */}
            <div className="hidden md:flex items-center gap-1 border-l border-ajin-gray-600 pl-4">
              {languages.map((lang) => (
                <Link
                  key={lang.code}
                  href={pathname}
                  locale={lang.code}
                  className={cn(
                    'px-2 py-1 text-xs font-semibold rounded-md transition-colors',
                    locale === lang.code
                      ? 'bg-ajin-accent text-ajin-primary'
                      : 'text-ajin-gray-400 hover:text-white'
                  )}
                >
                  {lang.label}
                </Link>
              ))}
            </div>

            {/* Botón */}
            <Link href="/contacto">
              <Button variant="primary" size="sm" className="hidden md:inline-flex whitespace-nowrap">
                {t('common.schedule')}
              </Button>
            </Link>

            {/* Menú móvil */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-ajin-primary" style={{ height: '100dvh' }}>
          <div className="flex flex-col flex-1 px-4 pb-6 overflow-y-auto" style={{ paddingTop: '64px' }}>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'rounded-xl px-4 py-4 text-lg font-medium transition-colors',
                      isActive
                        ? 'bg-ajin-accent text-ajin-primary'
                        : 'bg-ajin-primary-light text-white'
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
            <div className="flex gap-2 mt-4">
              {languages.map((lang) => (
                <Link
                  key={lang.code}
                  href={pathname}
                  locale={lang.code}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors',
                    locale === lang.code
                      ? 'bg-ajin-accent text-ajin-primary'
                      : 'bg-ajin-primary-light text-ajin-gray-400'
                  )}
                >
                  {lang.label}
                </Link>
              ))}
            </div>
            <div className="mt-auto pt-4">
              <Link href="/contacto" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" className="w-full">
                  {t('common.schedule')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
