const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const N8N_WEBHOOK_BASE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE || '';

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  area?: string;
  message: string;
}

export interface PowerData {
  name: string;
  email: string;
  phone: string;
  description: string;
}

export interface LeadData {
  name: string;
  phone: string;
  message: string;
  topic?: string;
  /** 'property' = interés en un inmueble del marketplace. */
  source?: 'landing' | 'property';
}

export interface PropertyRequestData {
  id?: number;
  operation: string;
  type: string;
  title: string;
  price_cop: number;
  owner_name: string;
  owner_phone: string;
  owner_email?: string;
  neighborhood?: string;
  city?: string;
  photos?: number;
}

const AREA_LABELS: Record<string, string> = {
  familia: 'Familia y Sucesiones',
  inmobiliario: 'Derecho Inmobiliario',
  comercial: 'Comercial y Corporativo',
  general: 'Consulta General',
};

export function areaLabel(area?: string): string {
  return (area && AREA_LABELS[area]) || 'Consulta General';
}

/**
 * Los mensajes se envían con parse_mode HTML: cualquier `<`, `>` o `&`
 * procedente del usuario rompería el formato (y Telegram rechazaría el
 * mensaje), así que se escapa antes de interpolarlo.
 */
export function escapeTelegram(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendToTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return null;
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    }
  );
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Telegram error: ${err}`);
  }
  return response.json();
}

export async function sendToN8n(webhookPath: string, data: unknown) {
  if (!N8N_WEBHOOK_BASE) return null;
  const response = await fetch(`${N8N_WEBHOOK_BASE}/${webhookPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to send to n8n');
  return response.json();
}

export function formatContactMessage(data: ContactData): string {
  return (
    `<b>📩 Nuevo contacto - AJIN</b>\n\n` +
    `<b>Nombre:</b> ${escapeTelegram(data.name)}\n` +
    `<b>Email:</b> ${escapeTelegram(data.email)}\n` +
    `<b>Teléfono:</b> ${escapeTelegram(data.phone)}\n` +
    `<b>Área:</b> ${escapeTelegram(areaLabel(data.area))}\n` +
    `<b>Mensaje:</b>\n${escapeTelegram(data.message)}`
  );
}

export function formatPowerMessage(data: PowerData): string {
  return (
    `<b>📄 Solicitud de Poder - AJIN</b>\n\n` +
    `<b>Nombre:</b> ${escapeTelegram(data.name)}\n` +
    `<b>Email:</b> ${escapeTelegram(data.email)}\n` +
    `<b>Teléfono:</b> ${escapeTelegram(data.phone)}\n` +
    `<b>Descripción:</b>\n${escapeTelegram(data.description)}`
  );
}

export function leadHeadline(data: LeadData): string {
  return data.source === 'property'
    ? `🏠 Interés en inmueble - ${data.topic ?? 'AJIN'}`
    : `💼 Solicitud de asesoría - ${data.topic ?? 'AJIN'}`;
}

export function formatLeadMessage(data: LeadData): string {
  return (
    `<b>${escapeTelegram(leadHeadline(data))}</b>\n\n` +
    `<b>Nombre:</b> ${escapeTelegram(data.name)}\n` +
    `<b>Teléfono:</b> ${escapeTelegram(data.phone)}\n` +
    (data.source === 'property'
      ? `<b>Inmueble:</b> ${escapeTelegram(data.topic ?? '')}\n`
      : `<b>Asunto:</b> ${escapeTelegram(data.topic ?? 'Consulta general')}\n`) +
    `<b>Mensaje:</b>\n${escapeTelegram(data.message)}`
  );
}

export function formatPropertyRequestMessage(data: PropertyRequestData): string {
  const idLine = data.id ? ` #${data.id}` : '';
  return (
    `<b>🏠 Nueva propiedad para publicar${idLine} - AJIN</b>\n\n` +
    `<b>Título:</b> ${escapeTelegram(data.title)}\n` +
    `<b>Operación:</b> ${escapeTelegram(data.operation)}\n` +
    `<b>Tipo:</b> ${escapeTelegram(data.type)}\n` +
    `<b>Precio:</b> $${data.price_cop.toLocaleString('es-CO')} COP\n` +
    (data.neighborhood
      ? `<b>Sector:</b> ${escapeTelegram(data.neighborhood)}, ${escapeTelegram(data.city ?? '')}\n`
      : '') +
    (data.photos !== undefined ? `<b>Fotos:</b> ${data.photos}\n` : '') +
    `<b>Dueño:</b> ${escapeTelegram(data.owner_name)}\n` +
    `<b>Teléfono:</b> ${escapeTelegram(data.owner_phone)}` +
    (data.owner_email ? `\n<b>Email:</b> ${escapeTelegram(data.owner_email)}` : '')
  );
}
