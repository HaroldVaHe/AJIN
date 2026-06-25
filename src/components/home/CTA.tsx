'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/Section';
import Button from '@/components/ui/Button';
import { ArrowRight, Scale } from 'lucide-react';

export default function CTA() {
  const t = useTranslations('home.cta');

  return (
    <Section className="bg-ajin-green text-center">
      <div className="flex flex-col items-center animate-fade-in">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-black/10">
          <Scale size={32} className="text-black" />
        </div>
        <h2 className="text-3xl font-bold text-black md:text-4xl lg:text-5xl">
          {t('title')}
        </h2>
        <p className="mt-4 text-lg text-black/70 max-w-xl">
          {t('subtitle')}
        </p>
        <Link href="/contacto" className="mt-8">
          <Button variant="secondary" size="lg">
            {t('ctaButton')}
            <ArrowRight size={20} className="ml-2" />
          </Button>
        </Link>
      </div>
    </Section>
  );
}
