export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ajinabogados.online';
export const SITE_NAME = 'AJIN';
export const SITE_TAGLINE = 'Asesoría Jurídica Inmobiliaria y Notarial';
export const OG_IMAGE_URL = `${SITE_URL}/images/og-image.png`;

export function buildAlternates(locale: string, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      es: `/es${path}`,
      en: `/en${path}`,
    },
  };
}
