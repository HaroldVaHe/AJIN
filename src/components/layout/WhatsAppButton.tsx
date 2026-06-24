'use client';

import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '573504338533';
const WHATSAPP_MESSAGE = 'Hola, quisiera agendar una consulta con AJIN.';

export default function WhatsAppButton() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ajin-green text-black shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-ajin-green-dark hover:text-white"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle size={28} />
    </a>
  );
}
