import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient, getAdminEmails } from '@/lib/supabase/server';
import {
  DEFAULT_ROLE_PERMISSIONS,
  isPermission,
  isRole,
  type Permission,
  type Role,
} from '@/lib/permission-catalog';

export {
  PERMISSIONS,
  ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  isPermission,
  isRole,
} from '@/lib/permission-catalog';
export type { Permission, Role } from '@/lib/permission-catalog';

/**
 * Rol efectivo de un email:
 *   1. ADMIN_EMAILS (env) → admin, sin consultar la base.
 *   2. fila en `user_roles` → su rol.
 *   3. sin fila / tabla no disponible → null (sin acceso).
 */
export async function resolveRole(email: string | null | undefined): Promise<Role | null> {
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!normalized) return null;
  if (getAdminEmails().includes(normalized)) return 'admin';

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('email', normalized)
      .maybeSingle();
    if (error) return null;
    return isRole(data?.role) ? data.role : null;
  } catch {
    return null;
  }
}

/** Permisos del rol: los de la base si existen, si no los de fábrica. */
export async function getRolePermissions(role: Role): Promise<Permission[]> {
  const fallback = DEFAULT_ROLE_PERMISSIONS[role];
  const supabase = createSupabaseAdminClient();
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission')
      .eq('role', role);
    if (error || !data || data.length === 0) return fallback;

    const permissions = data
      .map((row) => row.permission)
      .filter(isPermission);
    // El rol admin siempre conserva el acceso al panel y al cerebro, incluso
    // si la siembra de permisos todavía no incluye las claves nuevas.
    if (role === 'admin') {
      if (!permissions.includes('roles.manage')) permissions.push('roles.manage');
      if (!permissions.includes('knowledge.view')) permissions.push('knowledge.view');
      if (!permissions.includes('knowledge.manage')) permissions.push('knowledge.manage');
    }
    return permissions;
  } catch {
    return fallback;
  }
}

export interface SessionAuth {
  email: string;
  role: Role | null;
  permissions: Permission[];
}

/** Sesión actual + rol + permisos (una sola lectura de cookies). */
export async function getSessionAuth(): Promise<SessionAuth> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email ?? '';
    const role = await resolveRole(email);
    const permissions = role ? await getRolePermissions(role) : [];
    return { email, role, permissions };
  } catch {
    return { email: '', role: null, permissions: [] };
  }
}

export function hasPermission(auth: SessionAuth, permission: Permission): boolean {
  return auth.permissions.includes(permission);
}

/** Guard para rutas API: exige sesión con el permiso indicado. */
export async function requirePermissionWithUser(
  permission: Permission
): Promise<{ ok: boolean; email: string; role: Role | null }> {
  const auth = await getSessionAuth();
  return {
    ok: hasPermission(auth, permission),
    email: auth.email,
    role: auth.role,
  };
}
