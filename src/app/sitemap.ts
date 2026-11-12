import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { getAllSlugs } from '@/lib/blog';
import { fetchApprovedIds } from '@/lib/supabase/public';

// Runtime (no build-time) para que las env de Supabase sensibles estén disponibles.
export const revalidate = 3600;

const locales = ['es', 'en'] as const;

type ChangeFrequency = 'daily' | 'weekly' | 'monthly';

const staticPages: Array<{ path: string; priority: number; changeFrequency?: ChangeFrequency }> = [
  { path: '', priority: 1.0 },
  { path: '/nosotros', priority: 0.8 },
  { path: '/servicios', priority: 0.9 },
  { path: '/servicios/familia-sucesiones', priority: 0.8 },
  { path: '/servicios/inmobiliario', priority: 0.8 },
  { path: '/servicios/comercial-corporativo', priority: 0.8 },
  { path: '/inmuebles', priority: 0.9, changeFrequency: 'daily' },
  { path: '/blog', priority: 0.7 },
  { path: '/poderes', priority: 0.7 },
  { path: '/contacto', priority: 0.6 },
  { path: '/privacidad', priority: 0.5 },
  { path: '/terminos', priority: 0.5 },
  { path: '/datos-personales', priority: 0.5 },
  { path: '/landing/abogado-laboral-bogota', priority: 0.9 },
  { path: '/landing/abogado-despido-injustificado', priority: 0.9 },
  { path: '/landing/abogado-divorcio-bogota', priority: 0.9 },
  { path: '/landing/asesoria-juridica-empresas', priority: 0.9 },
  { path: '/landing/abogado-cobro-cartera', priority: 0.9 },
];

type Priority = 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${SITE_URL}/${locale}${page.path}`,
        lastModified,
        changeFrequency: page.changeFrequency ?? 'monthly',
        priority: page.priority as Priority,
      });
    }

    for (const slug of getAllSlugs(locale)) {
      entries.push({
        url: `${SITE_URL}/${locale}/blog/${slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  try {
    const propertyIds = await fetchApprovedIds();
    for (const locale of locales) {
      for (const id of propertyIds) {
        entries.push({
          url: `${SITE_URL}/${locale}/inmuebles/${id}`,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch {
    // Supabase no disponible: se omite la sección de inmuebles.
  }

  return entries;
}
