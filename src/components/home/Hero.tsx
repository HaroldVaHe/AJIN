'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import { Scale, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  const t = useTranslations('home.hero');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ajin-black via-ajin-black to-ajin-gray-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(142,200,63,0.08),_transparent_50%)]" />
      <div className="container-ajin relative px-4 py-20 md:py-32 lg:py-40">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ajin-green/30 bg-ajin-green/10 px-4 py-1.5 text-sm text-ajin-green">
              <Scale size={14} />
              <span>{t('badge')}</span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl lg:text-6xl lg:leading-tight">
              {t('title')}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ajin-gray-300 md:text-xl max-w-2xl">
              {t('subtitle')}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/contacto">
                <Button variant="primary" size="lg">
                  {t('requestAdvice')}
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Link href="/contacto">
                <Button variant="outline" size="lg">
                  {t('schedule')}
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex justify-center animate-fade-in">
            <div className="relative w-full max-w-[400px] aspect-square">
              <Image
                src="/images/Balanza.png"
                alt={t('imageAlt')}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
