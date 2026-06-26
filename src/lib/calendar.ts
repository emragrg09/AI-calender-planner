import { google } from 'googleapis';
import { getAuthorizedClient } from './google-auth';
import { CalendarEvent } from '@/types/calendar';

const CREATED_BY_KEY = 'createdBy';
const CREATED_BY_VALUE = 'ai-calendar-planner';

/**
 * Maps a Google Calendar event object to our application's CalendarEvent type
 */
function mapGoogleEventToAppEvent(gEvent: any): CalendarEvent {
  const isAllDay = !gEvent.start?.dateTime;
  const start = isAllDay ? gEvent.start?.date : gEvent.start?.dateTime;
  const end = isAllDay ? gEvent.end?.date : gEvent.end?.dateTime;
  
  // Extract custom app metadata if available
  const createdBy = gEvent.extendedProperties?.private?.[CREATED_BY_KEY];

  return {
    id: gEvent.id || '',
    summary: gEvent.summary || '(No Title)',
    description: gEvent.description || '',
    start: start || '',
    end: end || '',
    isAllDay,
    createdBy,
  };
}

/**
 * Fetches events from the connected user's primary Google Calendar in the specified range.
 */
export async function listCalendarEvents(timeMin: string, timeMax: string): Promise<CalendarEvent[]> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const items = response.data.items || [];
  return items.map(mapGoogleEventToAppEvent);
}

/**
 * Creates a new event in the user's primary calendar.
 * Marks it with app metadata: { extendedProperties: { private: { createdBy: 'ai-calendar-planner' } } }
 */
export async function createCalendarEvent(eventData: Omit<CalendarEvent, 'id' | 'createdBy'>): Promise<CalendarEvent> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const resource: any = {
    summary: eventData.summary,
    description: eventData.description,
    extendedProperties: {
      private: {
        [CREATED_BY_KEY]: CREATED_BY_VALUE,
      },
    },
  };

  if (eventData.isAllDay) {
    resource.start = { date: eventData.start };
    resource.end = { date: eventData.end };
  } else {
    resource.start = { dateTime: eventData.start };
    resource.end = { dateTime: eventData.end };
  }

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: resource,
  });

  return mapGoogleEventToAppEvent(response.data);
}

/**
 * Updates a Google Calendar event if it was created by this app.
 */
export async function updateCalendarEvent(eventId: string, eventData: Omit<CalendarEvent, 'id' | 'createdBy'>): Promise<CalendarEvent> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });

  // 1. Fetch the existing event first to verify ownership
  const existingEvent = await calendar.events.get({
    calendarId: 'primary',
    eventId,
  });

  const createdBy = existingEvent.data.extendedProperties?.private?.[CREATED_BY_KEY];
  if (createdBy !== CREATED_BY_VALUE) {
    throw new Error('Unauthorized: You cannot modify calendar events that were not created by this app.');
  }

  // 2. Perform the update
  const resource: any = {
    summary: eventData.summary,
    description: eventData.description,
    extendedProperties: {
      private: {
        [CREATED_BY_KEY]: CREATED_BY_VALUE,
      },
    },
  };

  if (eventData.isAllDay) {
    resource.start = { date: eventData.start };
    resource.end = { date: eventData.end };
  } else {
    resource.start = { dateTime: eventData.start };
    resource.end = { dateTime: eventData.end };
  }

  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId,
    requestBody: resource,
  });

  return mapGoogleEventToAppEvent(response.data);
}

/**
 * Deletes a Google Calendar event if it was created by this app.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });

  // 1. Fetch the existing event to verify ownership
  const existingEvent = await calendar.events.get({
    calendarId: 'primary',
    eventId,
  });

  const createdBy = existingEvent.data.extendedProperties?.private?.[CREATED_BY_KEY];
  if (createdBy !== CREATED_BY_VALUE) {
    throw new Error('Unauthorized: You cannot delete calendar events that were not created by this app.');
  }

  // 2. Perform the deletion
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}
