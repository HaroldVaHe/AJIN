import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { serviceGroups } from '@/data/services';
import { Heart, Home, Briefcase, FileText, ArrowRight } from 'lucide-react';

const icons: Record<string, React.ElementType> = {
  Heart, Home, Briefcase, FileText,
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
      <section className="bg-ajin-primary py-20 md:py-32">
        <div className="container-ajin px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">{s('title')}</h1>
          <p className="mt-4 text-lg text-ajin-gray-400 max-w-2xl mx-auto">{s('subtitle')}</p>
        </div>
      </section>

      <Section>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {serviceGroups.map((group) => {
            const Icon = icons[group.icon] || FileText;
            return (
              <Link key={group.id} href={`/servicios/${group.slug}`}>
                <Card className="h-full group">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ajin-accent/10 text-ajin-accent group-hover:bg-ajin-accent group-hover:text-white transition-colors">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-ajin-primary">{t(group.titleKey)}</h3>
                  <p className="mt-2 text-sm text-ajin-gray-300">{s(`${group.id}.description`)}</p>
                  <ul className="mt-4 space-y-2">
                    {group.items.map((_, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-ajin-gray-400">
                        <span className="h-1 w-1 rounded-full bg-ajin-accent shrink-0" />
                        {s(`${group.id}.items.${i}`)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-ajin-accent">
                    {s('consultation')}
                    <ArrowRight size={16} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
        <p className="mt-12 text-center text-lg text-ajin-gray-400">{s('moreServices')}</p>
      </Section>
    </>
  );
}
