import { NextRequest, NextResponse } from 'next/server';
import { deleteCalendarEvent } from '@/lib/calendar';
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
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id is required.' },
        { status: 400 }
      );
    }

    await deleteCalendarEvent(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/calendar/delete-event error:', error);
    const message = error.message || '';
    if (message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Permission denied: You can only delete events created by this application.' },
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
      { error: 'Failed to delete calendar event: ' + message },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const tokens = await getStoredTokens();
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google Calendar is not connected.', code: 'NO_CONNECTION' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id is required.' },
        { status: 400 }
      );
    }

    await deleteCalendarEvent(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/calendar/delete-event DELETE error:', error);
    const message = error.message || '';
    if (message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Permission denied: You can only delete events created by this application.' },
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
      { error: 'Failed to delete calendar event: ' + message },
      { status: 500 }
    );
  }
}
