export interface ServiceItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
  icon: string;
  items: string[];
}

export const services: ServiceItem[] = [
  {
    id: 'laboral',
    titleKey: 'services.laboral.title',
    descriptionKey: 'home.services.laboralDesc',
    href: '/servicios/derecho-laboral',
    icon: 'Briefcase',
    items: [
      'Despidos injustificados',
      'Liquidaciones laborales',
      'Acoso laboral',
      'Demandas laborales',
      'Contratos de trabajo',
      'Prestaciones sociales',
    ],
  },
  {
    id: 'familia',
    titleKey: 'services.familia.title',
    descriptionKey: 'home.services.familiaDesc',
    href: '/servicios/derecho-familia',
    icon: 'Heart',
    items: [
      'Divorcios',
      'Custodia de menores',
      'Alimentos',
      'Régimen de visitas',
      'Sucesiones',
      'Uniones maritales de hecho',
    ],
  },
  {
    id: 'civil',
    titleKey: 'services.civil.title',
    descriptionKey: 'home.services.civilDesc',
    href: '/servicios/derecho-civil',
    icon: 'FileText',
    items: [
      'Contratos',
      'Propiedades',
      'Obligaciones',
      'Responsabilidad civil',
      'Arrendamientos',
      'Propiedad horizontal',
    ],
  },
  {
    id: 'comercial',
    titleKey: 'services.comercial.title',
    descriptionKey: 'home.services.comercialDesc',
    href: '/servicios/derecho-comercial',
    icon: 'Building2',
    items: [
      'Constitución de empresas',
      'Contratos comerciales',
      'Sociedades SAS',
      'Propiedad intelectual',
      'Fusiones y adquisiciones',
      'Cobro de cartera',
    ],
  },
  {
    id: 'administrativo',
    titleKey: 'services.administrativo.title',
    descriptionKey: 'home.services.administrativoDesc',
    href: '/servicios/derecho-administrativo',
    icon: 'Shield',
    items: [
      'Contratación estatal',
      'Licencias y permisos',
      'Trámites gubernamentales',
      'Derecho tributario',
      'Responsabilidad fiscal',
      'Acciones constitucionales',
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
