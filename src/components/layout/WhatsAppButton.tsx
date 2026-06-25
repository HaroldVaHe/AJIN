'use client';

import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '573504338533';

export default function WhatsAppButton() {
  const t = useTranslations('common');
  const message = t('whatsappMessage');
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ajin-green text-black shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-ajin-green-dark hover:text-white"
      aria-label={t('whatsappAria')}
    >
      <MessageCircle size={28} />
    </a>
  );
}
