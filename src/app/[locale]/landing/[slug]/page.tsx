import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import { ArrowRight, CheckCircle } from 'lucide-react';

const slugToLandingKey: Record<string, string> = {
  'abogado-laboral-bogota': 'laboral',
  'abogado-despido-injustificado': 'despido',
  'abogado-divorcio-bogota': 'divorcio',
  'asesoria-juridica-empresas': 'empresas',
  'abogado-cobro-cartera': 'cobro',
};

const itemCounts: Record<string, number> = {
  laboral: 6,
  despido: 5,
  divorcio: 5,
  empresas: 5,
  cobro: 5,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const key = slugToLandingKey[slug];
  if (!key) return { title: 'Not found' };
  const t = await getTranslations({ locale, namespace: `landing.${key}` });
  return { title: t('title'), description: t('description') };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const key = slugToLandingKey[slug];
  if (!key) return null;

  const t = await getTranslations({ locale, namespace: `landing.${key}` });
  const d = await getTranslations({ locale, namespace: 'landing' });
  const count = itemCounts[key] || 0;

  return (
    <>
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl max-w-4xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg text-ajin-gray-300 max-w-2xl">
            {t('description')}
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold mb-6">{d('includes')}</h2>
            <div className="space-y-4">
              {Array.from({ length: count }, (_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-ajin-green shrink-0 mt-0.5" size={20} />
                  <span className="text-ajin-gray-200">{t(`items.${i}`)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ajin-surface rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">{d('needHelp')}</h3>
            <p className="text-ajin-gray-300 mb-6">
              {d('teamReady')}
            </p>
            <Link href="/contacto">
              <Button variant="primary" size="lg" className="w-full">
                {d('requestConsultation')}
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <Section className="bg-ajin-surface/50 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">{d('trustTitle')}</h2>
          <p className="text-ajin-gray-300 mb-8">
            {d('trustDesc')}
          </p>
          <Link href="/contacto">
            <Button variant="primary" size="lg">
              {d('contactUs')}
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </Link>
        </div>
      </Section>
    </>
  );
}
