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

async function sendToN8n(webhookPath: string, data: unknown) {
  if (!N8N_WEBHOOK_BASE) {
    console.warn('N8N webhook base not configured');
    return { success: true };
  }

  const response = await fetch(`${N8N_WEBHOOK_BASE}/${webhookPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to send to n8n');
  return response.json();
}

export async function sendContact(data: ContactData) {
  return sendToN8n('contact', data);
}

export async function sendPower(data: PowerData) {
  return sendToN8n('poderes', data);
}

export async function sendAssessment(data: ContactData) {
  return sendToN8n('asesoria', data);
}
