'use client';

import { useTranslations } from 'next-intl';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, DollarSign, Heart, Users, FileSignature, HandCoins } from 'lucide-react';

const cases = [
  { key: 'despido', icon: AlertTriangle },
  { key: 'liquidacion', icon: DollarSign },
  { key: 'divorcio', icon: Heart },
  { key: 'custodia', icon: Users },
  { key: 'contratos', icon: FileSignature },
  { key: 'cobro', icon: HandCoins },
] as const;

export default function CommonCases() {
  const t = useTranslations('home.cases');

  return (
    <Section className="bg-ajin-gray-50">
      <SectionHeader title={t('title')} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.key} className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ajin-green/10 text-ajin-green">
                <Icon size={24} />
              </div>
              <span className="font-semibold">{t(c.key)}</span>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
