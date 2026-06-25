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
    console.error('Telegram error:', err);
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
    `<b>Nombre:</b> ${data.name}\n` +
    `<b>Email:</b> ${data.email}\n` +
    `<b>Teléfono:</b> ${data.phone}\n` +
    `<b>Área:</b> ${data.area || 'General'}\n` +
    `<b>Mensaje:</b>\n${data.message}`
  );
}

export function formatPowerMessage(data: PowerData): string {
  return (
    `<b>📄 Solicitud de Poder - AJIN</b>\n\n` +
    `<b>Nombre:</b> ${data.name}\n` +
    `<b>Email:</b> ${data.email}\n` +
    `<b>Teléfono:</b> ${data.phone}\n` +
    `<b>Descripción:</b>\n${data.description}`
  );
}
