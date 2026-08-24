import nodemailer from 'nodemailer';
import type { ContactData, LeadData, PowerData, PropertyRequestData } from '@/lib/n8n';
import { areaLabel, leadHeadline } from '@/lib/n8n';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_TO = process.env.SMTP_TO || '';

export interface EmailPayload {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function emailLayout(rows: Array<{ label: string; value: string }>): string {
  const body = rows
    .map(
      (row) =>
        `<tr><td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;color:#1B2A4A;font-size:14px;vertical-align:top;"><strong>${row.label}</strong></td>` +
        `<td style="padding:8px 0 8px 16px;font-family:Arial,Helvetica,sans-serif;color:#4B5563;font-size:14px;">${row.value}</td></tr>`
    )
    .join('');

  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:#FAF7F2;border:1px solid #E5E0D8;border-radius:12px;overflow:hidden;">` +
    `<tr><td style="background:#1B2A4A;padding:20px 24px;"><span style="font-family:Georgia,serif;color:#C9A84C;font-size:18px;font-weight:bold;">AJIN</span> <span style="font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;font-size:13px;">Asesoría Jurídica Inmobiliaria y Notarial</span></td></tr>` +
    `<tr><td style="padding:8px 24px 24px;">${body}</td></tr></table>`
  );
}

export function formatContactEmail(data: ContactData): EmailPayload {
  return {
    subject: `📩 Nuevo contacto - ${data.name}`,
    html: emailLayout([
      { label: 'Nombre', value: escapeHtml(data.name) },
      { label: 'Email', value: escapeHtml(data.email) },
      { label: 'Teléfono', value: escapeHtml(data.phone) },
      { label: 'Área', value: escapeHtml(areaLabel(data.area)) },
      { label: 'Mensaje', value: escapeHtml(data.message) },
    ]),
  };
}

export function formatPowerEmail(data: PowerData): EmailPayload {
  return {
    subject: `📄 Solicitud de Poder - ${data.name}`,
    html: emailLayout([
      { label: 'Nombre', value: escapeHtml(data.name) },
      { label: 'Email', value: escapeHtml(data.email) },
      { label: 'Teléfono', value: escapeHtml(data.phone) },
      { label: 'Descripción', value: escapeHtml(data.description) },
    ]),
  };
}

export function formatLeadEmail(data: LeadData): EmailPayload {
  const isProperty = data.source === 'property';
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Nombre', value: escapeHtml(data.name) },
    { label: 'Teléfono', value: escapeHtml(data.phone) },
    isProperty
      ? { label: 'Inmueble', value: escapeHtml(data.topic ?? '') }
      : { label: 'Asunto', value: escapeHtml(data.topic ?? 'Consulta general') },
    { label: 'Mensaje', value: escapeHtml(data.message) },
  ];
  return {
    subject: `${leadHeadline(data)} - ${data.name}`,
    html: emailLayout(rows),
  };
}

export function formatPropertyRequestEmail(data: PropertyRequestData): EmailPayload {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Título', value: escapeHtml(data.title) },
    { label: 'Operación', value: escapeHtml(data.operation) },
    { label: 'Tipo', value: escapeHtml(data.type) },
    { label: 'Precio', value: `$${data.price_cop.toLocaleString('es-CO')} COP` },
  ];
  if (data.id) rows.push({ label: 'ID', value: `#${data.id}` });
  if (data.neighborhood)
    rows.push({ label: 'Sector', value: `${escapeHtml(data.neighborhood)}, ${escapeHtml(data.city ?? '')}` });
  if (data.photos !== undefined) rows.push({ label: 'Fotos', value: String(data.photos) });
  rows.push(
    { label: 'Dueño', value: escapeHtml(data.owner_name) },
    { label: 'Teléfono', value: escapeHtml(data.owner_phone) }
  );
  if (data.owner_email) rows.push({ label: 'Email', value: escapeHtml(data.owner_email) });
  return {
    subject: `🏠 Nueva propiedad para publicar - ${data.title}`,
    html: emailLayout(rows),
  };
}

export async function sendToEmail(payload: EmailPayload) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_TO) return null;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"AJIN Web" <${SMTP_USER}>`,
    to: SMTP_TO,
    subject: payload.subject,
    html: payload.html,
  });

  return true;
}
