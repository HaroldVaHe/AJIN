'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Section, SectionHeader } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { Briefcase, Heart, FileText, Building2, Shield } from 'lucide-react';

const icons = {
  Briefcase, Heart, FileText, Building2, Shield,
};

const serviceIds = [
  { id: 'laboral', icon: 'Briefcase', href: '/servicios/derecho-laboral' },
  { id: 'familia', icon: 'Heart', href: '/servicios/derecho-familia' },
  { id: 'civil', icon: 'FileText', href: '/servicios/derecho-civil' },
  { id: 'comercial', icon: 'Building2', href: '/servicios/derecho-comercial' },
  { id: 'administrativo', icon: 'Shield', href: '/servicios/derecho-administrativo' },
] as const;

export default function ServicesGrid() {
  const t = useTranslations('home.services');

  return (
    <Section className="bg-ajin-gray-50">
      <SectionHeader title={t('title')} subtitle={t('subtitle')} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {serviceIds.map((service) => {
          const Icon = icons[service.icon as keyof typeof icons];
          return (
            <Link key={service.id} href={service.href}>
              <Card className="h-full text-center group">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-ajin-green/10 text-ajin-green transition-colors group-hover:bg-ajin-green group-hover:text-white">
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold">{t(service.id)}</h3>
                <p className="mt-2 text-sm text-ajin-gray-400">{t(`${service.id}Desc`)}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
