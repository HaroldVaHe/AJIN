'use client';

import { useTranslations } from 'next-intl';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Heart, FileText, Home, Building2, FileSignature, Stamp } from 'lucide-react';

const cases = [
  { key: 'divorcio', icon: Heart },
  { key: 'sucesion', icon: FileText },
  { key: 'venta', icon: Home },
  { key: 'arriendo', icon: Building2 },
  { key: 'contratos', icon: FileSignature },
  { key: 'poderes', icon: Stamp },
] as const;

export default function CommonCases() {
  const t = useTranslations('home.cases');

  return (
    <Section>
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
