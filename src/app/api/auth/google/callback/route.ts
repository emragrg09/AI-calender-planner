import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, storeTokens } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth callback returned error:', error);
      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is missing from callback URL' },
        { status: 400 }
      );
    }

        const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('Google OAuth exchange failed: Access token was not returned.');
    }

    // Store tokens securely server-side in HTTP-only session cookie
    await storeTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      token_type: tokens.token_type || undefined
    });

    // Redirect user back to primary calendar page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error('Error handling Google OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(error.message || 'Callback failed')}`, request.url)
    );
  }
}
