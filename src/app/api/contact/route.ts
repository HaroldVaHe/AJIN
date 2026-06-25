import { NextRequest, NextResponse } from 'next/server';
import {
  sendToTelegram,
  sendToN8n,
  formatContactMessage,
} from '@/lib/n8n';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const results = await Promise.allSettled([
      sendToTelegram(formatContactMessage(data)),
      sendToN8n('contact', data),
    ]);

    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason);

    if (errors.length > 0) {
      console.error('Contact API errors:', errors);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
