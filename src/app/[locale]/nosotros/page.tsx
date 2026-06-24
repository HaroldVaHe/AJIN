import { getTranslations } from 'next-intl/server';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Shield, Target, Eye, Award, Lightbulb, Handshake } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.about' });
  return { title: t('title'), description: t('description') };
}

const valuesConfig = [
  { key: 'integrity', icon: Shield },
  { key: 'excellence', icon: Award },
  { key: 'innovation', icon: Lightbulb },
  { key: 'commitment', icon: Handshake },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <>
      <section className="bg-ajin-black py-20 md:py-32">
        <div className="container-ajin px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg text-ajin-gray-300 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold mb-4">{t('history.title')}</h2>
            <p className="text-ajin-gray-500 leading-relaxed">{t('history.content')}</p>
          </div>
          <div className="grid gap-6">
            <Card hover={false} className="border-l-4 border-l-ajin-green">
              <div className="flex items-center gap-3 mb-2">
                <Target className="text-ajin-green" size={24} />
                <h3 className="text-xl font-bold">{t('mission.title')}</h3>
              </div>
              <p className="text-ajin-gray-500">{t('mission.content')}</p>
            </Card>
            <Card hover={false} className="border-l-4 border-l-ajin-green">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="text-ajin-green" size={24} />
                <h3 className="text-xl font-bold">{t('vision.title')}</h3>
              </div>
              <p className="text-ajin-gray-500">{t('vision.content')}</p>
            </Card>
          </div>
        </div>
      </Section>

      <Section className="bg-ajin-gray-50">
        <SectionHeader title={t('values.title')} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valuesConfig.map((v) => {
            const Icon = v.icon;
            return (
              <Card key={v.key} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-ajin-green/10 text-ajin-green">
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold">{t(`values.${v.key}`)}</h3>
                <p className="mt-2 text-sm text-ajin-gray-400">{t(`values.${v.key}Desc`)}</p>
              </Card>
            );
          })}
        </div>
      </Section>
    </>
  );
}
