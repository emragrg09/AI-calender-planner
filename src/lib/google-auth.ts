import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { encryptToken, decryptToken } from './encryption';

const COOKIE_NAME = 'google_calendar_auth_tokens';

// Initialize the Google OAuth2 client
export function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI) are not configured.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Generate the Google OAuth authorization URL
export function getAuthorizationUrl() {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical to get refresh token
    prompt: 'consent',     // Forces consent screen to ensure refresh token is returned
    scope: [
      'https://www.googleapis.com/auth/calendar' // Read/write permissions for Google Calendar
    ],
  });
}

export interface SessionTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
}

/**
 * Decrypts and retrieves stored OAuth tokens from cookies.
 * Returns null if no cookies or invalid tokens exist.
 */
export async function getStoredTokens(): Promise<SessionTokens | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(COOKIE_NAME);
    if (!tokenCookie || !tokenCookie.value) {
      return null;
    }

    const decrypted = decryptToken(tokenCookie.value);
    const tokens = JSON.parse(decrypted) as SessionTokens;
    return tokens;
  } catch (error) {
    console.error('Failed to get stored tokens:', error);
    return null;
  }
}

/**
 * Encrypts and stores tokens in a secure HttpOnly cookie.
 */
export async function storeTokens(tokens: SessionTokens): Promise<void> {
  const cookieStore = await cookies();
  
  // If we already have stored tokens, and the new tokens do not contain a refresh token,
  // we must preserve the existing refresh token.
  if (!tokens.refresh_token) {
    const currentTokens = await getStoredTokens();
    if (currentTokens && currentTokens.refresh_token) {
      tokens.refresh_token = currentTokens.refresh_token;
    }
  }

  const serialized = JSON.stringify(tokens);
  const encrypted = encryptToken(serialized);
  
  // Save tokens in a secure HTTP-only cookie valid for 30 days
  cookieStore.set({
    name: COOKIE_NAME,
    value: encrypted,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clears the stored OAuth tokens from cookies.
 */
export async function clearStoredTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Gets an authorized Google OAuth client using cookies.
 * Automatically handles token refreshing if the access token has expired.
 */
export async function getAuthorizedClient() {
  const tokens = await getStoredTokens();
  if (!tokens) {
    throw new Error('No Google Calendar connection found.');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Check if token is expired (or close to it, within 5 minutes)
  const isExpired = tokens.expiry_date ? tokens.expiry_date < (Date.now() + 5 * 60 * 1000) : true;

  if (isExpired && tokens.refresh_token) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      const newTokens = refreshed.credentials as SessionTokens;
      
      // Store updated tokens (storeTokens will preserve the refresh token if not returned)
      await storeTokens(newTokens);
      oauth2Client.setCredentials(newTokens);
    } catch (error: any) {
      console.error('Error refreshing access token:', error);
      // If refresh token is revoked or invalid, clear tokens to trigger reconnection state
      if (error?.message?.includes('invalid_grant') || error?.status === 400 || error?.status === 401) {
        await clearStoredTokens();
      }
      throw new Error('Google Calendar connection expired. Please reconnect.');
    }
  } else if (isExpired && !tokens.refresh_token) {
    throw new Error('Google Calendar connection expired. Please reconnect.');
  }

  return oauth2Client;
}
