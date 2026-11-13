/**
 * Catálogo de roles y permisos, seguro para componentes de cliente.
 * No importa nada de Supabase ni `next/headers`.
 */

export const PERMISSIONS = [
  'properties.manage',
  'properties.delete',
  'leases.manage',
  'leases.finance',
  'knowledge.view',
  'knowledge.manage',
  'audit.view',
  'roles.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = ['admin', 'gestor'] as const;
export type Role = (typeof ROLES)[number];

/** Permisos iniciales de cada rol (también sirven de respaldo si falta la tabla). */
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [...PERMISSIONS],
  gestor: [
    'properties.manage',
    'properties.delete',
    'leases.manage',
    'leases.finance',
    'knowledge.view',
    'audit.view',
  ],
};

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (PERMISSIONS as readonly string[]).includes(value);
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
