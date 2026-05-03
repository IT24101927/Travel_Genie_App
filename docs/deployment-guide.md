# Deployment Guide (MongoDB Atlas + Render + Expo)

## 1. MongoDB Atlas

1. Create Atlas cluster
2. Create DB user and password
3. Whitelist Render outbound IPs or allow `0.0.0.0/0` for academic demo
4. Get connection URI and set as `MONGO_URI`

## 2. Backend Deploy (Render)

1. Push repository to GitHub
2. Create Render Web Service with root `Backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars:
   - `NODE_ENV=production`
   - `PORT=10000` (or Render default)
   - `MONGO_URI=<atlas-uri>`
   - `JWT_SECRET=<strong-secret>`
   - `JWT_EXPIRES_IN=7d`
   - `CORS_ORIGINS=*` (tighten for production)

## 3. Configuring the Mobile API

Before building or starting the mobile app for production, you must point it to your hosted backend.

1. Open `mobile/app.json`.
2. Add or update the `extra` field within the `expo` object:

```json
{
  "expo": {
    ...
    "extra": {
      "apiBaseUrl": "https://your-backend-service.railway.app/api/v1"
    }
  }
}
```

*Note: The app will automatically prioritize this URL over local development defaults.*

---

## 4. Frontend Deployment (Mobile)

Since the app uses Expo, you have two primary ways to share the frontend:

### Option A: Professional APK (Android)
Generate an installable `.apk` file that works on any Android device without needing your PC to be running.

1. Install EAS CLI: `npm install -g eas-cli`
2. Log in to your Expo account: `eas login`
3. Configure the build: `eas build:configure`
4. Run the build: `eas build --platform android --profile preview`
5. Download the resulting `.apk` from the link provided by Expo.

### Option B: Expo Go (Quick Demo)
1. Ensure your `Backend` is hosted (Railway/Render).
2. Update `mobile/app.json` or `.env` with the hosted API URL.
3. Run `npx expo start --tunnel`.
4. Scan the QR code with the **Expo Go** app.

---

## 4. Team Viva Demo Flow

To demonstrate the full platform capabilities during the Viva:

1. **User Workflow**:
   - Login to the mobile app.
   - Create a new trip (District → Places → Hotels).
   - Add transit bookings from the "Transit Board".
   - Record expenses and view budget health/summaries.
   - Post a review for a visited location.

2. **Admin Workflow**:
   - Log in to the Admin Dashboard.
   - Moderate the newly created review (Approve/Reject).
   - Check system-wide statistics and budget alerts.
   - Manage transport schedules or market price records.

3. **Backend Validation**:
   - Show the hosted API URL.
   - Demonstrate the MongoDB Atlas collection updates in real-time.
