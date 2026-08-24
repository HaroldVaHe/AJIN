import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/property-api';
import { logAudit, getSessionUserEmail, requestIp } from '@/lib/audit';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Registra eventos de sesión desde el cliente (login OK/fallo, logout).
 * El login exitoso se verifica contra la cookie de sesión; el fallo se
 * registra como intento con el email reclamado (rate-limited por IP).
 */
export async function POST(request: NextRequest) {
  let body: { ok?: boolean; logout?: boolean; email?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  if (body.logout) {
    if (await requireAdminApi()) {
      await logAudit({
        request,
        actorEmail: await getSessionUserEmail(),
        action: 'admin.logout',
      });
    }
    return NextResponse.json({ success: true });
  }

  const claimed = String(body.email ?? '').slice(0, 160);

  if (body.ok) {
    const verified = await getSessionUserEmail();
    await logAudit({
      request,
      actorEmail: verified || claimed,
      action: 'admin.login',
      detail: { session_verified: Boolean(verified) },
    });
    return NextResponse.json({ success: true });
  }

  if (!rateLimit(`login-fail:${requestIp(request)}`, 20)) {
    return NextResponse.json({ success: true });
  }
  await logAudit({
    request,
    actorEmail: claimed,
    action: 'admin.login_failed',
    detail: { reason: String(body.reason ?? '').slice(0, 200) },
  });
  return NextResponse.json({ success: true });
}
