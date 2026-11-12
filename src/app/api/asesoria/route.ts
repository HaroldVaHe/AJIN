import { NextRequest, NextResponse } from 'next/server';
import { sendToTelegram, sendToN8n, formatLeadMessage } from '@/lib/n8n';
import { sendToEmail, formatLeadEmail } from '@/lib/email';
import { parseLead, deliveredCount } from '@/lib/lead-forms';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  if (!rateLimit(`asesoria:${clientIp(request)}`, 10)) {
    return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const data = parseLead(body);
  if (!data) {
    return NextResponse.json({ success: false, error: 'Invalid data' }, { status: 400 });
  }

  const results = await Promise.allSettled([
    sendToTelegram(formatLeadMessage(data)),
    sendToEmail(formatLeadEmail(data)),
    sendToN8n('asesoria', data),
  ]);

  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`Asesoria API channel ${i} failed:`, r.reason);
  });

  if (deliveredCount(results) === 0) {
    return NextResponse.json({ success: false, error: 'Delivery failed' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
