import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import { ArrowRight, CheckCircle } from 'lucide-react';

const serviceConfigs = {
  'derecho-laboral': {
    items: ['Despidos injustificados', 'Liquidaciones laborales', 'Acoso laboral', 'Demandas laborales', 'Contratos de trabajo', 'Prestaciones sociales'],
  },
  'derecho-familia': {
    items: ['Divorcios', 'Custodia de menores', 'Alimentos', 'Régimen de visitas', 'Sucesiones', 'Uniones maritales de hecho'],
  },
  'derecho-civil': {
    items: ['Contratos', 'Propiedades', 'Obligaciones', 'Responsabilidad civil', 'Arrendamientos', 'Propiedad horizontal'],
  },
  'derecho-comercial': {
    items: ['Constitución de empresas', 'Contratos comerciales', 'Sociedades SAS', 'Propiedad intelectual', 'Fusiones y adquisiciones', 'Cobro de cartera'],
  },
  'derecho-administrativo': {
    items: ['Contratación estatal', 'Licencias y permisos', 'Trámites gubernamentales', 'Derecho tributario', 'Responsabilidad fiscal', 'Acciones constitucionales'],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const ns = slug.replace('derecho-', '');
  const t = await getTranslations({ locale, namespace: `seo.${ns}` });
  return { title: t('title'), description: t('description') };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const config = serviceConfigs[slug as keyof typeof serviceConfigs];
  if (!config) return null;

  const ns = slug.replace('derecho-', '');
  const t = await getTranslations({ locale, namespace: `services.${ns}` });

  return (
    <>
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4">
          <h1 className="text-4xl font-bold text-white md:text-5xl">{t('title')}</h1>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold mb-6">Servicios incluyendo:</h2>
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
            <h3 className="text-xl font-bold mb-4">¿Necesita asesoría en esta área?</h3>
            <p className="text-ajin-gray-500 mb-6">
              Nuestro equipo de abogados especializados está listo para atender su caso.
            </p>
            <Link href="/contacto">
              <Button variant="primary" size="lg" className="w-full">
                Solicitar una Consulta
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
