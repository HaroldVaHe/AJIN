import { NextRequest, NextResponse } from 'next/server';
import {
  sendToTelegram,
  sendToN8n,
  formatPowerMessage,
} from '@/lib/n8n';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const results = await Promise.allSettled([
      sendToTelegram(formatPowerMessage(data)),
      sendToN8n('poderes', data),
    ]);

    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason);

    if (errors.length > 0) {
      console.error('Poderes API errors:', errors);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Poderes API error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
