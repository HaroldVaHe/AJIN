import { getTranslations } from 'next-intl/server';
import { Section } from '@/components/ui/Section';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.dataProtection' });
  return { title: t('title'), description: t('description') };
}

export default async function DataProtectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dataProtection' });
  const sections = t.raw('sections') as { title: string; content: string }[];

  return (
    <>
      <section className="bg-ajin-primary py-20 md:py-32">
        <div className="container-ajin px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-ajin-gray-400 max-w-2xl mx-auto">{t('subtitle')}</p>
          <p className="mt-2 text-sm text-ajin-gray-400">{t('lastUpdated')}</p>
        </div>
      </section>

      <Section>
        <div className="max-w-3xl mx-auto prose prose-lg">
          {sections.map((section, i) => (
            <div key={i}>
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
