import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/calendar';
import { getStoredTokens } from '@/lib/google-auth';

export async function POST(request: NextRequest) {
  try {
    const tokens = await getStoredTokens();
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Calendar is not connected.', code: 'NO_CONNECTION' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { summary, start, end, description, isAllDay } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: summary, start, and end are required.' },
        { status: 400 }
      );
    }

    const createdEvent = await createCalendarEvent({
      summary,
      start,
      end,
      description,
      isAllDay: !!isAllDay,
    });

    return NextResponse.json({ success: true, event: createdEvent });
  } catch (error: any) {
    console.error('API /api/calendar/create-event error:', error);
    const message = error.message || '';
    if (message.includes('expired') || message.includes('reconnect') || message.includes('invalid_grant')) {
      return NextResponse.json(
        { error: 'Calendar connection expired. Please reconnect.', code: 'EXPIRED_TOKEN' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create calendar event: ' + message },
      { status: 500 }
    );
  }
}
