import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/property-api';
import { logAudit, getSessionUserEmail, requestIp } from '@/lib/audit';
import { isAdminEmail } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

const WINDOW_MS = 10 * 60 * 1000;

/**
 * Registra eventos de sesión desde el cliente (login OK/fallo, logout).
 * El login exitoso se verifica contra la cookie de sesión; el fallo se
 * registra como intento con el email reclamado. Todos los caminos están
 * limitados por IP para que nadie pueda inflar el log de auditoría.
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(`login-audit:${requestIp(request)}`, 30, WINDOW_MS)) {
    return NextResponse.json({ success: true });
  }

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

  if (body.ok) {
    const verified = await getSessionUserEmail();
    // Solo se registra un login real; un POST anónimo con {ok:true} se ignora.
    if (!isAdminEmail(verified)) {
      return NextResponse.json({ success: true });
    }
    await logAudit({
      request,
      actorEmail: verified,
      action: 'admin.login',
      detail: { session_verified: true },
    });
    return NextResponse.json({ success: true });
  }

  const claimed = String(body.email ?? '').slice(0, 160);
  await logAudit({
    request,
    actorEmail: claimed,
    action: 'admin.login_failed',
    detail: {
      reason: String(body.reason ?? '').slice(0, 200),
      session_verified: false,
    },
  });
  return NextResponse.json({ success: true });
}
