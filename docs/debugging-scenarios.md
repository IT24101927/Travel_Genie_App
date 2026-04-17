# Common Debugging Scenarios

## 1. 401 Unauthorized on protected endpoint

Cause: Missing or invalid JWT
Fix: Send `Authorization: Bearer <token>` and confirm token is from latest login.

## 2. 400 on expense creation

Cause: Enum mismatch or invalid tripId/date
Fix: Use categories exactly: `transport|food|hotel|activity|shopping|other` and valid Mongo ID for trip.

## 3. CORS error from mobile

Cause: Backend CORS not allowing mobile origin
Fix: Set `CORS_ORIGINS` appropriately or use `*` for viva demo.

## 4. MongoDB connection failure

Cause: wrong Atlas URI, wrong password, network blocked
Fix: verify URI, DB user, and IP access in Atlas.

## 5. Expo app cannot reach local backend

Cause: wrong base URL for emulator/device
Fix:
- Android emulator: `10.0.2.2`
- iOS simulator: `localhost`
- Physical device: machine LAN IP

## 6. Multer upload fails

Cause: wrong content type or unsupported file
Fix: send `multipart/form-data` and image file under expected field name.
