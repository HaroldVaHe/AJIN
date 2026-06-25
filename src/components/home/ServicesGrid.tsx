'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { serviceGroups } from '@/data/services';
import { Heart, Home, Briefcase, FileText, ArrowRight } from 'lucide-react';

const icons: Record<string, React.ElementType> = {
  Heart, Home, Briefcase, FileText,
};

export default function ServicesGrid() {
  const t = useTranslations('home.services');
  const ts = useTranslations('services');

  return (
    <Section className="bg-ajin-surface/50">
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {serviceGroups.map((group) => {
          const Icon = icons[group.icon] || FileText;
          return (
            <Link key={group.id} href={`/servicios/${group.slug}`}>
              <Card className="h-full group">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ajin-green/10 text-ajin-green group-hover:bg-ajin-green group-hover:text-white transition-colors">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold">{t(group.id)}</h3>
                <p className="mt-2 text-sm text-ajin-gray-300">{t(`${group.id}Desc`)}</p>
                <ul className="mt-4 space-y-1.5">
                  {group.items.slice(0, 4).map((_, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-ajin-gray-400">
                      <span className="h-1 w-1 rounded-full bg-ajin-green shrink-0" />
                      {ts(`${group.id}.items.${i}`)}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-ajin-green">
                  {t('learnMore')}
                  <ArrowRight size={14} />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
