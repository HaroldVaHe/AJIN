import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Scale, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const t = useTranslations();

  const navLinks = [
    { href: '/', key: 'common.nav.home' },
    { href: '/nosotros', key: 'common.nav.about' },
    { href: '/servicios', key: 'common.nav.services' },
    { href: '/blog', key: 'common.nav.blog' },
    { href: '/poderes', key: 'common.nav.powers' },
    { href: '/contacto', key: 'common.nav.contact' },
  ];

  const serviceLinks = [
    { href: '/servicios/familia-sucesiones', key: 'services.familia.title' },
    { href: '/servicios/inmobiliario', key: 'services.inmobiliario.title' },
    { href: '/servicios/comercial-corporativo', key: 'services.comercial.title' },
  ];

  return (
    <footer className="bg-ajin-black text-white">
      <div className="container-ajin px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="text-ajin-green" size={28} />
              <span className="text-xl font-bold">
                <span className="text-white">AJ</span>
                <span className="text-ajin-green">IN</span>
              </span>
            </div>
            <p className="text-sm text-ajin-gray-300 leading-relaxed">
              {t('common.footer.description')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ajin-gray-200 mb-4">
              {t('common.nav.services')}
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ajin-gray-300 hover:text-ajin-green transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ajin-gray-200 mb-4">
              {t('common.footer.links')}
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ajin-gray-300 hover:text-ajin-green transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ajin-gray-200 mb-4">
              {t('common.nav.contact')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-ajin-gray-300">
                <MapPin size={16} className="text-ajin-green shrink-0" />
                {t('common.address')}
              </li>
              <li className="flex items-center gap-2 text-sm text-ajin-gray-300">
                <Phone size={16} className="text-ajin-green shrink-0" />
                {t('common.phone')}
              </li>
              <li className="flex items-center gap-2 text-sm text-ajin-gray-300">
                <Mail size={16} className="text-ajin-green shrink-0" />
                {t('common.email')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-ajin-gray-800">
        <div className="container-ajin px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ajin-gray-400">
            &copy; {new Date().getFullYear()} AJIN. {t('common.footer.rights')}
          </p>
          <div className="flex gap-4">
            <Link href="/privacidad" className="text-xs text-ajin-gray-400 hover:text-ajin-green transition-colors">
              {t('common.footer.privacy')}
            </Link>
            <Link href="/terminos" className="text-xs text-ajin-gray-400 hover:text-ajin-green transition-colors">
              {t('common.footer.terms')}
            </Link>
            <Link href="/datos-personales" className="text-xs text-ajin-gray-400 hover:text-ajin-green transition-colors">
              {t('common.footer.dataProtection')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
