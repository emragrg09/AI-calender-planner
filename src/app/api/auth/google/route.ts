import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/google-auth';

export async function GET() {
  try {
    const url = getAuthorizationUrl();
    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error('Error starting Google auth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Calendar connection: ' + error.message },
      { status: 500 }
    );
  }
}
