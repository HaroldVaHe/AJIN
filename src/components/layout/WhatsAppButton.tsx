'use client';

import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

export default function WhatsAppButton() {
  const t = useTranslations('common');
  const whatsappUrl = buildWhatsAppUrl(t('whatsappMessage'));

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ajin-accent text-ajin-primary shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-ajin-accent-dark hover:text-white"
      aria-label={t('whatsappAria')}
    >
      <MessageCircle size={28} />
    </a>
  );
}
