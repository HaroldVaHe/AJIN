import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { SITE_URL, OG_IMAGE_URL, SITE_NAME } from '@/lib/site';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import JsonLd from '@/components/ui/JsonLd';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Base metadata — will be overridden per page
  return {
    metadataBase: new URL(SITE_URL),
    title: 'AJIN — Asesoría Jurídica Inmobiliaria y Notarial',
    description: 'Asesoría jurídica especializada en inmobiliario, notarial, familia y corporativo en Bogotá.',
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        es: `${SITE_URL}/es`,
        en: `${SITE_URL}/en`,
      },
    },
    icons: {
      icon: [
        { url: '/icons/favicon.ico', sizes: 'any' },
        { url: '/icons/favicon.png', type: 'image/png' },
      ],
      apple: '/icons/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: locale === 'es' ? 'es_CO' : 'en_US',
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      title: 'AJIN — Asesoría Jurídica Inmobiliaria y Notarial',
      description: 'Asesoría jurídica especializada en inmobiliario, notarial, familia y corporativo en Bogotá.',
      images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AJIN — Asesoría Jurídica Inmobiliaria y Notarial',
      description: 'Asesoría jurídica especializada en inmobiliario, notarial, familia y corporativo en Bogotá.',
      images: [OG_IMAGE_URL],
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'es' | 'en')) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'LegalService',
            name: SITE_NAME,
            url: SITE_URL,
            image: OG_IMAGE_URL,
            logo: `${SITE_URL}/icons/favicon.png`,
            telephone: '+573504338533',
            email: 'asesoriainmobiliariaynotarial@gmail.com',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Calle 12 # 13-26',
              addressLocality: 'Chía',
              addressRegion: 'Cundinamarca',
              addressCountry: 'CO',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 4.8625878,
              longitude: -74.0646584,
            },
            openingHours: 'Mo-Fr 09:00-18:00',
            priceRange: '$$',
            areaServed: ['Bogotá', 'Chía', 'Cundinamarca'],
            sameAs: [],
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
