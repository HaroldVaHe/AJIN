import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { services } from '@/data/services';
import { Briefcase, Heart, FileText, Building2, Shield, ArrowRight } from 'lucide-react';

const icons: Record<string, React.ElementType> = {
  Briefcase, Heart, FileText, Building2, Shield,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.services' });
  return { title: t('title'), description: t('description') };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const s = await getTranslations({ locale, namespace: 'services' });

  return (
    <>
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">{s('title')}</h1>
          <p className="mt-4 text-lg text-ajin-gray-300 max-w-2xl mx-auto">{s('subtitle')}</p>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = icons[service.icon] || FileText;
            return (
              <Link key={service.id} href={service.href}>
                <Card className="h-full group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ajin-green/10 text-ajin-green group-hover:bg-ajin-green group-hover:text-white transition-colors">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold">{t(service.titleKey)}</h3>
                  <ul className="mt-4 space-y-2">
                    {service.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-ajin-gray-500">
                        <span className="h-1 w-1 rounded-full bg-ajin-green shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-ajin-green">
                    {s('consultation')}
                    <ArrowRight size={16} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </Section>
    </>
  );
}
