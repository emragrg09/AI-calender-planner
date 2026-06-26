# AI Calendar Planner with Google Calendar Sync

An intelligent schedule planner and time blocker built using **Next.js 16 (App Router)**, **TypeScript**, and secure server-side API routes. It fetches your Google Calendar commitments, identifies free time windows within your defined working hours, and schedules your manually added tasks (accounting for breaks, priorities, and custom focus session durations).

---

## 🚀 Setup & Installation

### 1. Clone the project and install dependencies
```bash
npm install
```

### 2. Configure Google Cloud Console for OAuth
To connect Google Calendar, you need to create OAuth credentials in the Google Cloud Console:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Search for **Google Calendar API** and click **Enable**.
4. Go to **APIs & Services > OAuth consent screen**:
   - Select **User Type** as **External** (or Internal if inside an organization).
   - Fill in the required app details.
   - Under **Scopes**, click **Add or Remove Scopes** and add:
     `https://www.googleapis.com/auth/calendar` (read/write calendar events).
   - Add your own email as a **Test User** (since the app will run in testing mode).
5. Go to **APIs & Services > Credentials**:
   - Click **+ Create Credentials** and select **OAuth client ID**.
   - Set **Application type** to **Web application**.
   - Under **Authorized JavaScript origins**, add:
     `http://localhost:3000`
   - Under **Authorized redirect URIs**, add:
     `http://localhost:3000/api/auth/google/callback`
   - Click **Create** and copy your **Client ID** and **Client Secret**.

### 3. Configure Environment Variables
Create a file named `.env.local` in the root of the workspace and fill in the configuration details:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Security Configuration
# Generate a secure 32-character key for encryption (e.g., openssl rand -base64 32)
TOKEN_ENCRYPTION_KEY=your-secure-32-byte-encryption-key-here
```

---

## 🛠️ Running the Application

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔒 Security Design

- **Server-side Execution**: All Google Calendar API interactions occur strictly server-side.
- **AES-256-GCM Token Encryption**: User access and refresh tokens are encrypted on the server before storage.
- **HttpOnly Cookies**: Encrypted tokens are sent to the user as a secure `HttpOnly`, `SameSite=Lax` session cookie. Google client secrets, API keys, and raw oauth credentials are never exposed to the frontend.
- **Safe Modifications**: The app tags created events with custom metadata (`createdBy: ai-calendar-planner`) in the event's `privateExtendedProperties`. Users can only edit or delete events created by this application; personal Google Calendar events are read-only.
