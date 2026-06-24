import { getTranslations } from 'next-intl/server';
import Hero from '@/components/home/Hero';
import ServicesGrid from '@/components/home/ServicesGrid';
import Benefits from '@/components/home/Benefits';
import CommonCases from '@/components/home/CommonCases';
import CTA from '@/components/home/CTA';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.home' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
    },
  };
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesGrid />
      <Benefits />
      <CommonCases />
      <CTA />
    </>
  );
}
