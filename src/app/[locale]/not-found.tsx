import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';

export default async function LocaleNotFound() {
  const t = await getTranslations('common');

  return (
    <section className="section-padding">
      <div className="container-ajin text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-ajin-accent">404</p>
        <h1 className="mt-2 text-3xl font-bold text-ajin-primary md:text-4xl">
          {t('notFoundTitle')}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-ajin-gray-300">{t('notFoundText')}</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-ajin-accent px-5 py-3 text-sm font-semibold text-ajin-primary transition-colors hover:bg-ajin-accent-dark hover:text-white"
        >
          <ArrowLeft size={16} /> {t('backHome')}
        </Link>
      </div>
    </section>
  );
}
