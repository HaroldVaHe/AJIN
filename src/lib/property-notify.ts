import { sendToTelegram, sendToN8n, formatPropertyRequestMessage, PropertyRequestData } from '@/lib/n8n';
import { sendToEmail, formatPropertyRequestEmail } from '@/lib/email';

/**
 * Envía Telegram + email + n8n en paralelo. La ruta debe hacer await:
 * en Vercel serverless las promesas sin await mueren al congelarse la
 * función tras devolver la respuesta.
 */
export async function notifyPropertyRequest(data: PropertyRequestData): Promise<void> {
  const results = await Promise.allSettled([
    sendToTelegram(formatPropertyRequestMessage(data)),
    sendToEmail(formatPropertyRequestEmail(data)),
    sendToN8n('inmueble-solicitud', data),
  ]);
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`notifyPropertyRequest[${i}] failed:`, r.reason);
  });
}
