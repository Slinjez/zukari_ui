# Zukari UI

The **Zukari UI** is the React/Vite frontend for the Zukari diabetes companion app.

It provides a mobile-first interface for account access, glucose logging, insulin tracking, food logs, reports, reminders, profile settings, and future activity/Health Connect integration.

---

## Features

- Login and registration screen.
- API-based authentication flow.
- Mobile number input with country support.
- JWT session storage.
- Guarded app screens after login.
- Professional animations and transitions.
- Local diary fallback for offline use.
- Cloud-sync service foundation.
- Glucose, insulin, food, reports, learn, and profile screens.
- Google login UI foundation.

---

## Tech Stack

- React
- Vite
- JavaScript
- `lucide-react`
- `react-phone-number-input`
- Capacitor-ready architecture

---

## Project Structure

```text
src/
├── components/
├── constants/
├── screens/
├── services/
├── styles/
├── App.jsx
└── main.jsx
```

Important files:

```text
src/screens/Auth.jsx
src/services/apiAuth.js
src/services/apiHealth.js
src/services/zukariCloudStore.js
src/styles/animations.css
src/styles/phone-input.css
```

---

## Setup

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

---

## Environment

Create `.env.local`:

```env
VITE_ZUKARI_API_BASE_URL=https://127.0.0.1:8000/api
VITE_GOOGLE_CLIENT_ID=
```

Restart Vite after changing `.env.local`.

---

## Authentication Flow

The UI calls:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
GET  /api/me
PATCH /api/me
```

On successful login/register, the returned JWT is stored locally and used for protected API calls.

---

## Health Sync Flow

The UI should save records using the cloud store:

```text
zukariCloudStore.addGlucoseLog()
zukariCloudStore.addInsulinLog()
zukariCloudStore.addMealLog()
zukariCloudStore.bulkImportGlucoseLogs()
```

Expected API calls:

```text
POST /api/glucose-logs
POST /api/insulin-logs
POST /api/food-logs
POST /api/sync/import
```

If the API is unavailable, records should be kept locally with an unsynced status.

---

## Local HTTPS Note

The Symfony backend may run on:

```text
https://127.0.0.1:8000
```

If the browser blocks requests, open the API URL once in the browser and accept the local certificate warning.

---

## Recommended Next UI Work

1. Add visible sync badges.
2. Add retry sync button.
3. Add multiple reminders and notification settings.
4. Add dashboard summary cards.
5. Add Health Connect permission/settings screen.
6. Polish APK build and mobile navigation.
