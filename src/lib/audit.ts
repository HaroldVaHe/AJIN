import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AuditInput {
  request: Request;
  actorEmail?: string;
  action: string;
  entity?: string;
  entityId?: string | number | null;
  detail?: Record<string, unknown>;
}

export function requestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? '';
}

/** Email del admin autenticado en la sesión actual ('' si no hay). */
export async function getSessionUserEmail(): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? '';
  } catch {
    return '';
  }
}

/**
 * Registra una entrada de auditoría. Debe hacerse await antes de responder:
 * en serverless las promesas huérfanas mueren al congelarse la función.
 * Nunca lanza: un fallo de auditoría no debe romper la operación principal.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) return;
    const { error } = await supabase.from('audit_log').insert({
      actor_email: input.actorEmail ?? '',
      action: input.action,
      entity: input.entity ?? '',
      entity_id: input.entityId != null ? String(input.entityId) : '',
      detail: input.detail ?? {},
      ip: requestIp(input.request),
      user_agent: (input.request.headers.get('user-agent') ?? '').slice(0, 500),
    });
    if (error) console.error('Audit log failed:', error.message);
  } catch (err) {
    console.error('Audit log threw:', err);
  }
}

const UA_OS: Array<[RegExp, string]> = [
  [/Windows/i, 'Windows'],
  [/Android/i, 'Android'],
  [/iPhone|iPad|iPod/i, 'iOS'],
  [/Mac OS X|Macintosh/i, 'macOS'],
  [/Linux/i, 'Linux'],
];

const UA_BROWSER: Array<[RegExp, string]> = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Chrome\//, 'Chrome'],
  [/Firefox\//, 'Firefox'],
  [/Safari\//, 'Safari'],
];

/** Etiqueta legible "Sistema · Navegador" a partir del User-Agent. */
export function deviceLabel(ua: string): string {
  const os = UA_OS.find(([re]) => re.test(ua))?.[1] ?? '';
  const browser = UA_BROWSER.find(([re]) => re.test(ua))?.[1] ?? '';
  const label = [os, browser].filter(Boolean).join(' · ');
  return label || (ua ? ua.slice(0, 40) : '—');
}
