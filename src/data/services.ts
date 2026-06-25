export interface ServiceGroup {
  id: string;
  slug: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  items: string[];
}

export const serviceGroups: ServiceGroup[] = [
  {
    id: 'familia',
    slug: 'familia-sucesiones',
    titleKey: 'services.familia.title',
    descriptionKey: 'services.familia.description',
    icon: 'Heart',
    items: [
      'Divorcios',
      'Sucesiones',
      'Testamentos',
      'Demandas de familia',
      'Liquidación de sociedad conyugal',
      'Procesos de apoyo (antes Interdicción)',
      'Cancelaciones de patrimonio',
    ],
  },
  {
    id: 'inmobiliario',
    slug: 'inmobiliario',
    titleKey: 'services.inmobiliario.title',
    descriptionKey: 'services.inmobiliario.description',
    icon: 'Home',
    items: [
      'Ventas',
      'Arriendos',
      'Avalúos',
      'Englobes y desenglobes',
      'División material',
      'Promesas de compraventa',
      'Préstamos sobre hipoteca',
    ],
  },
  {
    id: 'comercial',
    slug: 'comercial-corporativo',
    titleKey: 'services.comercial.title',
    descriptionKey: 'services.comercial.description',
    icon: 'Briefcase',
    items: [
      'Liquidación de sociedades',
      'Contratos',
      'Poderes',
      'Derechos de petición',
    ],
  },
];

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  image?: string;
  author: string;
}

export interface LandingPage {
  slug: string;
  titleKey: string;
  descriptionKey: string;
  seoTitleKey: string;
  seoDescKey: string;
}

export const landingPages: LandingPage[] = [
  {
    slug: 'abogado-laboral-bogota',
    titleKey: 'landing.laboral.title',
    descriptionKey: 'landing.laboral.description',
    seoTitleKey: 'seo.laboral.title',
    seoDescKey: 'seo.laboral.description',
  },
  {
    slug: 'abogado-despido-injustificado',
    titleKey: 'landing.despido.title',
    descriptionKey: 'landing.despido.description',
    seoTitleKey: 'seo.laboral.title',
    seoDescKey: 'seo.laboral.description',
  },
  {
    slug: 'abogado-divorcio-bogota',
    titleKey: 'landing.divorcio.title',
    descriptionKey: 'landing.divorcio.description',
    seoTitleKey: 'seo.familia.title',
    seoDescKey: 'seo.familia.description',
  },
  {
    slug: 'asesoria-juridica-empresas',
    titleKey: 'landing.empresas.title',
    descriptionKey: 'landing.empresas.description',
    seoTitleKey: 'seo.comercial.title',
    seoDescKey: 'seo.comercial.description',
  },
  {
    slug: 'abogado-cobro-cartera',
    titleKey: 'landing.cobro.title',
    descriptionKey: 'landing.cobro.description',
    seoTitleKey: 'seo.comercial.title',
    seoDescKey: 'seo.comercial.description',
  },
];
