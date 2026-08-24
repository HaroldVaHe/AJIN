import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import PropertyCard from '@/components/inmuebles/PropertyCard';
import PropertyFilters from '@/components/inmuebles/PropertyFilters';
import { Section } from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import JsonLd from '@/components/ui/JsonLd';
import {
  fetchApprovedProperties,
} from '@/lib/supabase/public';
import { SITE_URL, OG_IMAGE_URL, buildAlternates } from '@/lib/site';
import type { PropertyOperation, PropertyType } from '@/types/property';

const OPERATIONS = ['venta', 'arriendo'];
const TYPES = ['apartamento', 'casa', 'oficina', 'lote', 'bodega'];

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'inmuebles' });
  return {
    title: t('seoTitle'),
    description: t('seoDescription'),
    alternates: buildAlternates(locale, '/inmuebles'),
    openGraph: {
      title: t('seoTitle'),
      description: t('seoDescription'),
      images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: t('listingTitle') }],
    },
  };
}

export default async function InmueblesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ operacion?: string; tipo?: string }>;
}) {
  const { locale } = await params;
  const { operacion, tipo } = await searchParams;
  const operation = OPERATIONS.includes(operacion ?? '')
    ? (operacion as PropertyOperation)
    : undefined;
  const propertyType = TYPES.includes(tipo ?? '') ? (tipo as PropertyType) : undefined;

  const t = await getTranslations({ locale, namespace: 'inmuebles' });
  const properties = await fetchApprovedProperties(operation, propertyType);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: t('listingTitle'),
          url: `${SITE_URL}/${locale}/inmuebles`,
          itemListElement: properties.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: p.title,
            url: `${SITE_URL}/${locale}/inmuebles/${p.id}`,
          })),
        }}
      />

      <section className="bg-ajin-primary py-16 md:py-24">
        <div className="container-ajin px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">{t('listingTitle')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ajin-gray-400">
            {t('listingSubtitle')}
          </p>
        </div>
      </section>

      <Section>
        <PropertyFilters operation={operation} type={propertyType} />

        <div className="mt-10">
          {properties.length === 0 ? (
            <p className="py-16 text-center text-lg text-ajin-gray-400">{t('noResults')}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-14 rounded-2xl bg-ajin-primary p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold text-white md:text-3xl">{t('publishCta')}</h2>
          <Link href="/inmuebles/publicar" className="mt-6 inline-block">
            <Button size="lg">{t('publishButton')}</Button>
          </Link>
        </div>
      </Section>
    </>
  );
}
