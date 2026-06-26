import { NextRequest, NextResponse } from 'next/server';
import { clearStoredTokens } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  try {
    await clearStoredTokens();
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect: ' + error.message },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    await clearStoredTokens();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar POST:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect: ' + error.message },
      { status: 500 }
    );
  }
}
