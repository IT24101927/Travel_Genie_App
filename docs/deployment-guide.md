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
   - `AI_SERVICE_ENABLED=false` (or true with URL)

## 3. Mobile API Base URL

In `mobile/app.json`, set:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "https://your-render-service.onrender.com/api/v1"
    }
  }
}
```

Then restart Expo.

## 4. Optional AI Deploy

- Deploy Flask service separately on Railway/Render
- Set backend:
  - `AI_SERVICE_ENABLED=true`
  - `AI_SERVICE_BASE_URL=<ai-service-url>`

## 5. Viva Demo Flow

- Show mobile login
- Show create trip
- Show add expenses
- Show expense summaries
- Show hosted backend URL in API calls
