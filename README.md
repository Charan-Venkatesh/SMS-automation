# SMS Automation System

A backend + Android app pair that queues SMS messages in PostgreSQL and sends
them from an Android device's own SIM. The backend never talks to a carrier —
it just stores messages; the phone does the actual sending via the native
Android `SmsManager` API.

```
backend/   Node.js + Express + TypeScript + PostgreSQL REST API
mobile/    React Native (TypeScript) Android app
```

## Architecture

```
PostgreSQL (sms_queue) <-> Backend REST API <-> Android app -> Android SmsManager -> Carrier
```

1. Rows are inserted into `sms_queue` with `status = PENDING`.
2. The Android app fetches pending messages over HTTP (`GET /messages/pending`).
3. For each message it calls the native `SmsManager` to send an SMS from the
   phone's own SIM, then reports the result back
   (`POST /messages/:id/sent` or `/messages/:id/failed`).

## 1. Backend setup

### Requirements
- Node.js 18+
- PostgreSQL 14+ (or Docker)

### Option A — Docker (recommended)

```bash
cp backend/.env.example backend/.env   # edit DB_PASSWORD / API_KEY as you like
docker compose up --build
```

This starts Postgres and the backend together, runs migrations automatically
on container start, and exposes the API on `http://localhost:3000`.

### Option B — Run locally

```bash
cd backend
cp .env.example .env      # edit DB_* values to match your local Postgres
npm install
createdb sms_automation   # or create it via psql/pgAdmin
npm run migrate           # applies backend/migrations/*.sql
npm run dev                # starts on http://localhost:3000 with hot reload
```

### Verify it's up

```bash
curl http://localhost:3000/health
```

## 2. API reference

Interactive Swagger UI: `http://localhost:3000/api-docs`
Raw OpenAPI JSON: `http://localhost:3000/api-docs.json`

| Method | Path                        | Purpose                              |
|--------|------------------------------|---------------------------------------|
| GET    | `/health` (or `/api/health`)| Backend status                        |
| GET    | `/messages`                  | List all messages (optional `?status=`) |
| GET    | `/messages/pending`          | List pending messages (FIFO)          |
| GET    | `/messages/count`            | Pending message count                 |
| POST   | `/messages`                  | Queue a new message                   |
| POST   | `/messages/:id/sent`         | Mark a message SENT                   |
| POST   | `/messages/:id/failed`       | Mark a message FAILED                 |
| POST   | `/messages/retry`            | Requeue FAILED messages (retry < 3)   |

`/api/messages...` aliases are also mounted for parity with the `/api/*`
convention. If `API_KEY` is set in `.env`, every request (except `/health`)
must include header `X-API-Key: <value>`.

## 3. Mobile app — build the APK

### Requirements
- Node.js 18+
- Android Studio (provides the Android SDK + a bundled JDK 17/21 under
  `Android Studio/jbr`) or a standalone Android SDK + JDK 17
- An Android device or emulator running Android 8+ (SMS sending needs a real
  SIM, so a physical device is required to actually send messages — an
  emulator can still be used to check the UI and API wiring)

### Install JS dependencies

```bash
cd mobile
npm install --legacy-peer-deps
```

### Build with Android Studio (GUI)

1. Open `mobile/android` in Android Studio.
2. Let Gradle sync finish.
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. Grab the APK from `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

### Build from the command line

```bash
cd mobile/android
# Point Gradle at a JDK 17 (Gradle 8.3 does not support JDK 21+/25)
export JAVA_HOME="/path/to/Android Studio/jbr"      # or any JDK 17 install
export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
./gradlew assembleDebug
```

The signed debug APK is written to
`mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Install it with:

```bash
adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### First run

1. Open the app — it asks for **SEND_SMS**, **READ_SMS**, and
   **READ_PHONE_STATE** permissions the first time you tap **Send Messages**.
2. Tap the gear icon and set the **Backend URL** to your machine's LAN IP,
   e.g. `http://192.168.1.100:3000` (phone and backend must be on the same
   network, or connect the phone via USB tethering).
3. The Home screen shows network status, backend status, and pending count.
4. Tap **Send Messages** to drain the queue. When done it shows
   `Sent: X  Failed: Y  Total: Z`.

## 4. Error handling already built in

- **Backend offline / DB error** → surfaced as a banner ("Cannot connect to
  backend server. Check IP and server status.") instead of crashing.
- **No internet / USB disconnected** → detected via `NetInfo` before a send
  run starts.
- **SMS send failure / invalid phone number** → caught per-message; the
  message is marked `FAILED` with the error text and can be requeued with
  **Retry Failed**.
- **Timeouts** → Axios request timeout (30s) with a friendly error message.
- **Permission denial** → blocks the send flow with an explicit prompt to
  grant permissions.

## 5. Roadmap (architected for, not yet built)

The service/repository layering (`SmsService`, `smsApi`, device-scoped
`deviceId` on every message) leaves room to add, without a rewrite:
background polling/scheduler, JWT auth (the `X-API-Key` header is already a
placeholder for it), push notifications, and multi-device support (the
`device_id` column already exists on `sms_queue`).
