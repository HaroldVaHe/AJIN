'use client';

import { useTranslations } from 'next-intl';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Zap, Award, Eye, UserCheck } from 'lucide-react';

const benefits = [
  { key: 'quick', icon: Zap },
  { key: 'experience', icon: Award },
  { key: 'transparent', icon: Eye },
  { key: 'personalized', icon: UserCheck },
];

export default function Benefits() {
  const t = useTranslations('home.benefits');

  return (
    <Section>
      <SectionHeader title={t('title')} />
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div key={benefit.key} className="text-center group">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ajin-primary text-ajin-accent transition-all group-hover:bg-ajin-accent group-hover:text-white">
                <Icon size={32} />
              </div>
              <h3 className="text-lg font-bold text-ajin-primary">{t(benefit.key)}</h3>
              <p className="mt-2 text-sm text-ajin-gray-300">{t(`${benefit.key}Desc`)}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
