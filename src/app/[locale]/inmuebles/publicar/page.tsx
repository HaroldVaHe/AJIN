import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import PropertySubmissionForm from '@/components/inmuebles/PropertySubmissionForm';
import { Section } from '@/components/ui/Section';
import { buildAlternates } from '@/lib/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inmuebles.publish' });
  return {
    title: `${t('title')} | AJIN`,
    description: t('subtitle'),
    alternates: buildAlternates(locale, '/inmuebles/publicar'),
    robots: { index: false },
  };
}

export default async function PublishPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inmuebles.publish' });

  return (
    <>
      <section className="bg-ajin-primary py-16 md:py-24">
        <div className="container-ajin px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">{t('title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ajin-gray-400">{t('subtitle')}</p>
        </div>
      </section>

      <Section>
        <PropertySubmissionForm />
      </Section>
    </>
  );
}
