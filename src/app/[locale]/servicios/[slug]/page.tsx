import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import { serviceGroups } from '@/data/services';
import { ArrowRight, CheckCircle } from 'lucide-react';

const slugToId: Record<string, string> = {};
for (const g of serviceGroups) {
  slugToId[g.slug] = g.id;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const id = slugToId[slug];
  if (!id) return { title: 'Not found' };
  const t = await getTranslations({ locale, namespace: `seo.${id}` });
  return { title: t('title'), description: t('description') };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const id = slugToId[slug];
  const group = serviceGroups.find((g) => g.id === id);
  if (!group) return null;

  const t = await getTranslations({ locale, namespace: `services.${group.id}` });
  const d = await getTranslations({ locale, namespace: 'services' });

  return (
    <>
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4">
          <h1 className="text-4xl font-bold text-white md:text-5xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-ajin-gray-300 max-w-2xl">{t('description')}</p>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold mb-6">{d('includes')}</h2>
            <div className="space-y-4">
              {group.items.map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-ajin-green shrink-0 mt-0.5" size={20} />
                  <span className="text-ajin-gray-600">{t(`items.${i}`)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ajin-gray-50 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-4">{d('needHelp')}</h3>
            <p className="text-ajin-gray-500 mb-6">
              {d('teamReady')}
            </p>
            <Link href="/contacto">
              <Button variant="primary" size="lg" className="w-full">
                {d('consultation')}
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
