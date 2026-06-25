import { MetadataRoute } from 'next';

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

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `https://ajin.com/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: parseFloat(page.priority) as 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0,
      });
    }
  }

  return entries;
}
