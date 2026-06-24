import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import { ArrowRight, CheckCircle } from 'lucide-react';

const landingConfig: Record<string, { titleKey: string; descKey: string; items: string[] }> = {
  'abogado-laboral-bogota': {
    titleKey: 'landing.laboral.title',
    descKey: 'landing.laboral.description',
    items: ['Despidos injustificados', 'Liquidaciones laborales', 'Acoso laboral', 'Demandas laborales', 'Contratos de trabajo', 'Negociaciones colectivas'],
  },
  'abogado-despido-injustificado': {
    titleKey: 'landing.despido.title',
    descKey: 'landing.despido.description',
    items: ['Evaluación gratuita de su caso', 'Cálculo de indemnización', 'Representación legal', 'Negociación con el empleador', 'Demanda laboral'],
  },
  'abogado-divorcio-bogota': {
    titleKey: 'landing.divorcio.title',
    descKey: 'landing.divorcio.description',
    items: ['Divorcio de mutuo acuerdo', 'Divorcio contencioso', 'Liquidación de sociedad conyugal', 'Custodia y alimentos', 'Asesoría integral'],
  },
  'asesoria-juridica-empresas': {
    titleKey: 'landing.empresas.title',
    descKey: 'landing.empresas.description',
    items: ['Constitución de empresas SAS', 'Contratos comerciales', 'Due diligence legal', 'Propiedad intelectual', 'Cobro de cartera'],
  },
  'abogado-cobro-cartera': {
    titleKey: 'landing.cobro.title',
    descKey: 'landing.cobro.description',
    items: ['Cobro prejurídico', 'Demanda ejecutiva', 'Embargos y secuestros', 'Acuerdos de pago', 'Recuperación de cartera'],
  },
};

const seoNamespace: Record<string, string> = {
  'abogado-laboral-bogota': 'laboral',
  'abogado-despido-injustificado': 'laboral',
  'abogado-divorcio-bogota': 'familia',
  'asesoria-juridica-empresas': 'comercial',
  'abogado-cobro-cartera': 'comercial',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const ns = seoNamespace[slug] || 'home';
  const t = await getTranslations({ locale, namespace: `seo.${ns}` });
  return { title: t('title'), description: t('description') };
}

function getLandingTitle(slug: string): string {
  const titles: Record<string, string> = {
    'abogado-laboral-bogota': 'Abogados Laborales en Bogotá',
    'abogado-despido-injustificado': 'Abogado para Despido Injustificado',
    'abogado-divorcio-bogota': 'Abogado de Divorcio en Bogotá',
    'asesoria-juridica-empresas': 'Asesoría Jurídica para Empresas',
    'abogado-cobro-cartera': 'Abogado de Cobro de Cartera',
  };
  return titles[slug] || slug;
}

function getLandingDesc(slug: string): string {
  const descs: Record<string, string> = {
    'abogado-laboral-bogota': 'Somos su firma de abogados laborales en Bogotá con amplia experiencia en despidos, liquidaciones y demandas laborales.',
    'abogado-despido-injustificado': 'Si fue despedido sin justa causa, nuestros abogados le ayudarán a reclamar su indemnización y derechos laborales.',
    'abogado-divorcio-bogota': 'Abogados especialistas en divorcios en Bogotá. Mutuo acuerdo y contencioso. Procesos ágiles y transparentes.',
    'asesoria-juridica-empresas': 'Asesoría jurídica integral para empresas en Bogotá. Constitución SAS, contratos, cumplimiento normativo.',
    'abogado-cobro-cartera': 'Recupere su cartera morosa con nuestros abogados especializados en cobro judicial y prejurídico en Bogotá.',
  };
  return descs[slug] || slug;
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const config = landingConfig[slug];
  if (!config) return null;

  const title = getLandingTitle(slug);
  const description = getLandingDesc(slug);

  return (
    <>
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl max-w-4xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-ajin-gray-300 max-w-2xl">
            {description}
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold mb-6">Nuestros servicios incluyen:</h2>
            <div className="space-y-4">
              {config.items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-ajin-green shrink-0 mt-0.5" size={20} />
                  <span className="text-ajin-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ajin-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">¿Necesita ayuda con este tema?</h3>
            <p className="text-ajin-gray-500 mb-6">
              Nuestro equipo está listo para atender su caso. Solicite una consulta hoy.
            </p>
            <Link href="/contacto">
              <Button variant="primary" size="lg" className="w-full">
                Solicitar Consulta
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      <Section className="bg-ajin-gray-50 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Confíe en AJIN</h2>
          <p className="text-ajin-gray-500 mb-8">
            Con más de 15 años de experiencia, somos su aliado jurídico de confianza en Bogotá.
            Procesos transparentes, atención personalizada y resultados efectivos.
          </p>
          <Link href="/contacto">
            <Button variant="primary" size="lg">
              Contáctenos
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </Link>
        </div>
      </Section>
    </>
  );
}
