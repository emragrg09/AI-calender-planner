import { NextRequest, NextResponse } from 'next/server';
import { listCalendarEvents } from '@/lib/calendar';
import { getStoredTokens } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  try {
    // 1. Check if tokens exist in cookie at all
    const tokens = await getStoredTokens();
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Calendar is not connected.', code: 'NO_CONNECTION' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') || new Date().toISOString();
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const events = await listCalendarEvents(timeMin, timeMax);
    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('API /api/calendar/events error:', error);
    
    const message = error.message || '';
    if (message.includes('No Google Calendar connection found') || message.includes('NO_CONNECTION')) {
      return NextResponse.json(
        { error: 'Google Calendar is not connected.', code: 'NO_CONNECTION' },
        { status: 401 }
      );
    }

    if (message.includes('expired') || message.includes('reconnect') || message.includes('invalid_grant') || message.includes('auth')) {
      return NextResponse.json(
        { error: 'Calendar connection expired. Please reconnect.', code: 'EXPIRED_TOKEN' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch calendar events: ' + message },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';
