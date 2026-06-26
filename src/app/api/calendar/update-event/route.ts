import { NextRequest, NextResponse } from 'next/server';
import { updateCalendarEvent } from '@/lib/calendar';
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
    const { id, summary, start, end, description, isAllDay } = body;

    if (!id || !summary || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: id, summary, start, and end are required.' },
        { status: 400 }
      );
    }

    const updatedEvent = await updateCalendarEvent(id, {
      summary,
      start,
      end,
      description,
      isAllDay: !!isAllDay,
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: any) {
    console.error('API /api/calendar/update-event error:', error);
    const message = error.message || '';
    if (message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Permission denied: You can only edit events created by this application.' },
        { status: 403 }
      );
    }
    if (message.includes('expired') || message.includes('reconnect') || message.includes('invalid_grant')) {
      return NextResponse.json(
        { error: 'Calendar connection expired. Please reconnect.', code: 'EXPIRED_TOKEN' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update calendar event: ' + message },
      { status: 500 }
    );
  }
}
