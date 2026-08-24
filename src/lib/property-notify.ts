import { sendToTelegram, sendToN8n, formatPropertyRequestMessage, PropertyRequestData } from '@/lib/n8n';
import { sendToEmail, formatPropertyRequestEmail } from '@/lib/email';

export function notifyPropertyRequest(data: PropertyRequestData): void {
  void sendToTelegram(formatPropertyRequestMessage(data));
  void sendToEmail(formatPropertyRequestEmail(data));
  void sendToN8n('inmueble-solicitud', data);
}
