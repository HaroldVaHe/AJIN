import { NextRequest, NextResponse } from 'next/server';
import {
  sendToTelegram,
  sendToN8n,
  formatLeadMessage,
} from '@/lib/n8n';
import { sendToEmail, formatLeadEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const results = await Promise.allSettled([
      sendToTelegram(formatLeadMessage(data)),
      sendToEmail(formatLeadEmail(data)),
      sendToN8n('asesoria', data),
    ]);

    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason);

    if (errors.length > 0) {
      console.error('Asesoria API errors:', errors);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Asesoria API error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
