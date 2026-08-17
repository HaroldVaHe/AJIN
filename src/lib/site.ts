export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ajinabogados.online';
export const SITE_NAME = 'AJIN';
export const SITE_TAGLINE = 'Asesoría Jurídica Inmobiliaria y Notarial';
export const OG_IMAGE_URL = `${SITE_URL}/images/og-image.png`;

export function buildAlternates(locale: string, path: string) {
  return {
    canonical: `${SITE_URL}/${locale}${path}`,
    languages: {
      es: `${SITE_URL}/es${path}`,
      en: `${SITE_URL}/en${path}`,
    },
  };
}
