import { getTranslations } from 'next-intl/server';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import PowerForm from '@/components/forms/PowerForm';
import { FileText, FileSignature, Gavel, ClipboardList } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.powers' });
  return { title: t('title'), description: t('description') };
}

const powerTypes = [
  { key: 'general', icon: FileText },
  { key: 'special', icon: FileSignature },
  { key: 'judicial', icon: Gavel },
  { key: 'administrative', icon: ClipboardList },
];

export default async function PowersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const i = await getTranslations({ locale, namespace: 'powers.info' });

  return (
    <>
      <section className="bg-ajin-primary py-20 md:py-32">
        <div className="container-ajin px-4 text-center">
          <PowersTitle />
          <p className="mt-4 text-lg text-ajin-gray-400 max-w-2xl mx-auto"><PowersSubtitle /></p>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-ajin-primary mb-6"><PowersFormTitle /></h2>
            <PowerForm />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ajin-primary mb-6">{i('title')}</h2>
            <div className="grid gap-4">
              {powerTypes.map((pt) => {
                const Icon = pt.icon;
                return (
                  <Card key={pt.key} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ajin-accent/10 text-ajin-accent">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-ajin-primary">{i(pt.key)}</h3>
                      <p className="text-sm text-ajin-gray-400">{i(`${pt.key}Desc`)}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

async function PowersTitle() {
  const t = await getTranslations('powers');
  return <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl text-center">{t('title')}</h1>;
}
async function PowersSubtitle() {
  const t = await getTranslations('powers');
  return <>{t('subtitle')}</>;
}
async function PowersFormTitle() {
  const t = await getTranslations('powers.form');
  return <>{t('submit')}</>;
}
