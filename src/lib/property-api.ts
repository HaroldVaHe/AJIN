import { createHmac, timingSafeEqual } from 'crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveRole, type Role } from '@/lib/permissions';

export const MAX_PHOTOS = 15;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Tipos aceptados en la subida (se evita SVG para no servir contenido activo). */
export const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/gif',
];

export const OPERATIONS = ['venta', 'arriendo'] as const;
export const PROPERTY_TYPES = ['apartamento', 'casa', 'oficina', 'lote', 'bodega'] as const;

export interface PropertyPayload {
  operation: string;
  type: string;
  title: string;
  description: string;
  price_cop: number;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  stratum: number | null;
  neighborhood: string;
  city: string;
  department: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
}

function intOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

export function parsePropertyPayload(body: Record<string, unknown>): PropertyPayload | null {
  if (!body) return null;

  const operation = String(body.operation ?? '');
  const type = String(body.type ?? '');
  if (!OPERATIONS.includes(operation as (typeof OPERATIONS)[number])) return null;
  if (!PROPERTY_TYPES.includes(type as (typeof PROPERTY_TYPES)[number])) return null;

  const title = String(body.title ?? '').trim();
  if (title.length < 5 || title.length > 140) return null;

  const price = Number(body.price_cop);
  if (!Number.isFinite(price) || price <= 0 || price > 1e12) return null;

  const stratum = intOrNull(body.stratum);
  if (stratum !== null && (stratum < 1 || stratum > 6)) return null;

  const ownerName = String(body.owner_name ?? '').trim();
  const ownerPhone = String(body.owner_phone ?? '').trim();
  if (ownerName.length === 0 || ownerName.length > 120) return null;
  if (ownerPhone.length < 7 || ownerPhone.length > 30) return null;

  const ownerEmail = String(body.owner_email ?? '').trim();

  return {
    operation,
    type,
    title,
    description: String(body.description ?? '').trim().slice(0, 5000),
    price_cop: Math.floor(price),
    area_m2: intOrNull(body.area_m2),
    bedrooms: intOrNull(body.bedrooms),
    bathrooms: intOrNull(body.bathrooms),
    parking: intOrNull(body.parking),
    stratum,
    neighborhood: String(body.neighborhood ?? '').trim().slice(0, 140),
    city: String(body.city ?? '').trim().slice(0, 80) || 'Bogotá',
    department: String(body.department ?? '').trim().slice(0, 80),
    owner_name: ownerName,
    owner_phone: ownerPhone,
    owner_email: ownerEmail.length > 0 && ownerEmail.length <= 160 ? ownerEmail : '',
  };
}

export async function requireAdminApi(): Promise<boolean> {
  return (await requireAdminApiWithUser()).ok;
}

/** Verifica sesión con rol asignado (env o `user_roles`) y devuelve el email. */
export async function requireAdminApiWithUser(): Promise<{
  ok: boolean;
  email: string;
  role: Role | null;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? '';
  const role = await resolveRole(email);
  return { ok: role !== null, email, role };
}

/**
 * Token HMAC para autorizar la subida de fotos de una solicitud recién
 * creada: sin él, cualquiera podría añadir fotos a un inmueble ajeno.
 * No requiere columna nueva en la base de datos.
 */
function uploadSecret(): string {
  return (
    process.env.UPLOAD_TOKEN_SECRET ||
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  );
}

export function createUploadToken(propertyId: number): string {
  const secret = uploadSecret();
  if (!secret) return '';
  return createHmac('sha256', secret).update(`upload:${propertyId}`).digest('base64url');
}

export function verifyUploadToken(propertyId: number, token: string | null): boolean {
  const expected = createUploadToken(propertyId);
  if (!expected || !token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
