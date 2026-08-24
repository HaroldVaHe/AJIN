import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, BedDouble, Bath, Car, Maximize2, Layers, MapPin } from 'lucide-react';
import PropertyGallery from '@/components/inmuebles/PropertyGallery';
import LeadForm from '@/components/forms/LeadForm';
import JsonLd from '@/components/ui/JsonLd';
import { fetchApprovedProperty } from '@/lib/supabase/public';
import { SITE_URL, OG_IMAGE_URL } from '@/lib/site';

export const revalidate = 60;

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const property = await fetchApprovedProperty(id);

  if (!property) {
    return {
      title: locale === 'en' ? 'Property not found | AJIN' : 'Inmueble no encontrado | AJIN',
      robots: { index: false },
    };
  }

  const title = `${property.title} | AJIN`;
  const description =
    property.description.slice(0, 155) ||
    `$${formatPrice(property.price_cop)} COP · ${property.city}`;
  const cover = property.images[0]?.url ?? OG_IMAGE_URL;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/inmuebles/${property.id}`,
    },
    openGraph: {
      title,
      description,
      images: [{ url: cover, width: 1200, height: 630, alt: property.title }],
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'inmuebles.detail' });
  const tInm = await getTranslations({ locale, namespace: 'inmuebles' });
  const property = await fetchApprovedProperty(id);

  if (!property || !/^\d+$/.test(id)) {
    return (
      <section className="section-padding">
        <div className="container-ajin text-center">
          <h1 className="text-3xl font-bold text-ajin-primary">{t('notFound')}</h1>
          <Link
            href="/inmuebles"
            className="mt-6 inline-flex items-center gap-2 text-ajin-accent hover:underline"
          >
            <ArrowLeft size={16} /> {t('backToList')}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: property.title,
          description: property.description || undefined,
          url: `${SITE_URL}/${locale}/inmuebles/${property.id}`,
          image: property.images.map((i) => i.url),
          offers: {
            '@type': 'Offer',
            price: property.price_cop,
            priceCurrency: 'COP',
            availability: 'https://schema.org/InStock',
          },
        }}
      />

      <section className="section-padding">
        <div className="container-ajin">
          <Link
            href="/inmuebles"
            className="inline-flex items-center gap-2 text-sm text-ajin-gray-300 transition-colors hover:text-ajin-accent"
          >
            <ArrowLeft size={16} /> {t('backToList')}
          </Link>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
            <div>
              <PropertyGallery images={property.images} title={property.title} />

              <div className="mt-8">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <span className="rounded-full bg-ajin-accent/15 px-3 py-1 text-sm font-semibold text-ajin-primary">
                    {tInm(`operations.${property.operation}`)}
                  </span>
                  <span className="rounded-full bg-ajin-surface px-3 py-1 text-sm text-ajin-gray-300">
                    {tInm(`types.${property.type}`)}
                  </span>
                  {(property.neighborhood || property.city) && (
                    <span className="flex items-center gap-1 text-sm text-ajin-gray-400">
                      <MapPin size={14} />
                      {[property.neighborhood, property.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-3xl font-bold text-ajin-primary md:text-4xl">
                  {property.title}
                </h1>

                <p className="mt-3 text-3xl font-bold text-ajin-primary">
                  ${formatPrice(property.price_cop)} COP
                  {property.operation === 'arriendo' && (
                    <span className="text-base font-normal text-ajin-gray-400">
                      {' '}
                      {tInm('perMonth')}
                    </span>
                  )}
                </p>
              </div>

              <div className="mt-8 border-t border-ajin-border pt-6">
                <h2 className="mb-4 text-xl font-semibold text-ajin-primary">{t('features')}</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {property.area_m2 && (
                    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                      <Maximize2 size={20} className="text-ajin-accent" />
                      <span className="text-sm">
                        {property.area_m2} {tInm('specs.areaM2')}
                      </span>
                    </div>
                  )}
                  {property.bedrooms !== null && (
                    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                      <BedDouble size={20} className="text-ajin-accent" />
                      <span className="text-sm">
                        {property.bedrooms} {tInm('specs.bedrooms')}
                      </span>
                    </div>
                  )}
                  {property.bathrooms !== null && (
                    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                      <Bath size={20} className="text-ajin-accent" />
                      <span className="text-sm">
                        {property.bathrooms} {tInm('specs.bathrooms')}
                      </span>
                    </div>
                  )}
                  {property.parking !== null && (
                    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                      <Car size={20} className="text-ajin-accent" />
                      <span className="text-sm">
                        {property.parking} {tInm('specs.parking')}
                      </span>
                    </div>
                  )}
                  {property.stratum !== null && (
                    <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                      <Layers size={20} className="text-ajin-accent" />
                      <span className="text-sm">
                        {tInm('specs.stratum')} {property.stratum}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {property.description && (
                <div className="mt-8 border-t border-ajin-border pt-6">
                  <h2 className="mb-4 text-xl font-semibold text-ajin-primary">
                    {t('description')}
                  </h2>
                  <p className="whitespace-pre-line text-ajin-gray-300">{property.description}</p>
                </div>
              )}

              <p className="mt-8 rounded-xl bg-ajin-surface px-4 py-3 text-xs text-ajin-gray-400">
                {t('ownerInfo')} · {t('code')}: #{property.id}
              </p>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
                <h2 className="text-xl font-semibold text-ajin-primary">{t('interested')}</h2>
                <p className="mt-2 text-sm text-ajin-gray-400">{t('contactDesc')}</p>
                <div className="mt-5">
                  <LeadForm topic={`${property.title} (#${property.id})`} variant="property" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
