import { NextRequest, NextResponse } from 'next/server';
import { requirePermissionWithUser, isRole, isPermission, type Permission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import {
  removeUserRole,
  saveRolePermissions,
  setUserRole,
} from '@/lib/supabase/leases';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/** Cambia los permisos de un rol. */
export async function PUT(request: NextRequest) {
  const auth = await requirePermissionWithUser('roles.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'role' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const role = body.role;
  if (!isRole(role)) {
    return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
  }
  if (!Array.isArray(body.permissions)) {
    return NextResponse.json({ success: false, error: 'Invalid permissions' }, { status: 400 });
  }

  const permissions = body.permissions.filter(isPermission) as Permission[];
  const ok = await saveRolePermissions(role, permissions);
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Save failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'role.permissions',
    entity: 'role',
    entityId: role,
    detail: { permissions },
  });

  return NextResponse.json({ success: true, permissions });
}

/** Asigna un rol a un email (el usuario debe existir en Authentication). */
export async function POST(request: NextRequest) {
  const auth = await requirePermissionWithUser('roles.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'role' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const role = body.role;
  if (!EMAIL_RE.test(email) || email.length > 160) {
    return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
  }

  const ok = await setUserRole(email, role);
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Save failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'role.assign',
    entity: 'role',
    entityId: email,
    detail: { role },
  });

  return NextResponse.json({ success: true });
}

/** Quita el rol de un email. */
export async function DELETE(request: NextRequest) {
  const auth = await requirePermissionWithUser('roles.manage');
  if (!auth.ok) {
    await logAudit({ request, action: 'admin.unauthorized', entity: 'role' });
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const email = (request.nextUrl.searchParams.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 });
  }

  const ok = await removeUserRole(email);
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 });
  }

  await logAudit({
    request,
    actorEmail: auth.email,
    action: 'role.remove',
    entity: 'role',
    entityId: email,
  });

  return NextResponse.json({ success: true });
}
