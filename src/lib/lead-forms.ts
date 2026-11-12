import type { ContactData, LeadData, PowerData } from '@/lib/n8n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const AREAS = ['familia', 'inmobiliario', 'comercial', 'general'] as const;

/** Texto normalizado y acotado; `null` si queda vacío. */
function text(value: unknown, max: number): string | null {
  const str = String(value ?? '').replace(/\u0000/g, '').trim();
  if (!str) return null;
  return str.slice(0, max);
}

function phone(value: unknown): string | null {
  const str = text(value, 30);
  if (!str) return null;
  const digits = str.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  return str;
}

function email(value: unknown): string | null {
  const str = text(value, 160);
  if (!str || !EMAIL_RE.test(str)) return null;
  return str;
}

export function parseContact(body: Record<string, unknown>): ContactData | null {
  const name = text(body.name, 120);
  const mail = email(body.email);
  const tel = phone(body.phone);
  const message = text(body.message, 4000);
  const rawArea = text(body.area, 40);
  const area = AREAS.includes(rawArea as (typeof AREAS)[number]) ? rawArea! : 'general';

  if (!name || !mail || !tel || !message) return null;
  return { name, email: mail, phone: tel, area, message };
}

export function parsePower(body: Record<string, unknown>): PowerData | null {
  const name = text(body.name, 120);
  const mail = email(body.email);
  const tel = phone(body.phone);
  const description = text(body.description, 4000);

  if (!name || !mail || !tel || !description) return null;
  return { name, email: mail, phone: tel, description };
}

export function parseLead(body: Record<string, unknown>): LeadData | null {
  const name = text(body.name, 120);
  const tel = phone(body.phone);
  const message = text(body.message, 4000);
  const topic = text(body.topic, 200) ?? undefined;
  const source = body.source === 'property' ? 'property' : 'landing';

  if (!name || !tel || !message) return null;
  return { name, phone: tel, message, topic, source };
}

/**
 * Cuenta los canales que realmente entregaron el mensaje (los no
 * configurados devuelven `null`). Si es 0, el lead se perdería: la ruta
 * debe responder con error en vez de un éxito falso.
 */
export function deliveredCount(results: PromiseSettledResult<unknown>[]): number {
  return results.filter(
    (r) => r.status === 'fulfilled' && r.value !== null && r.value !== undefined
  ).length;
}
