import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { getAllSlugs } from '@/lib/blog';
import { fetchApprovedIds } from '@/lib/supabase/public';

// Runtime (no build-time) para que las env de Supabase sensibles estén disponibles.
export const revalidate = 3600;

const locales = ['es', 'en'] as const;

const staticPages = [
  { path: '', priority: '1.0' },
  { path: '/nosotros', priority: '0.8' },
  { path: '/servicios', priority: '0.9' },
  { path: '/servicios/familia-sucesiones', priority: '0.8' },
  { path: '/servicios/inmobiliario', priority: '0.8' },
  { path: '/servicios/comercial-corporativo', priority: '0.8' },
  { path: '/blog', priority: '0.7' },
  { path: '/poderes', priority: '0.7' },
  { path: '/contacto', priority: '0.6' },
  { path: '/privacidad', priority: '0.5' },
  { path: '/terminos', priority: '0.5' },
  { path: '/datos-personales', priority: '0.5' },
  { path: '/landing/abogado-laboral-bogota', priority: '0.9' },
  { path: '/landing/abogado-despido-injustificado', priority: '0.9' },
  { path: '/landing/abogado-divorcio-bogota', priority: '0.9' },
  { path: '/landing/asesoria-juridica-empresas', priority: '0.9' },
  { path: '/landing/abogado-cobro-cartera', priority: '0.9' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${SITE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: parseFloat(page.priority) as 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0,
      });
    }

    for (const slug of getAllSlugs(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  try {
    const propertyIds = await fetchApprovedIds();
    for (const id of propertyIds) {
      entries.push({
        url: `${SITE_URL}/es/inmuebles/${id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
    entries.push({
      url: `${SITE_URL}/es/inmuebles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
    entries.push({
      url: `${SITE_URL}/en/inmuebles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  } catch {
    // Supabase not reachable at build time — skip properties
  }

  return entries;
}
