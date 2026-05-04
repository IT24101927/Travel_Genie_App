# 🚀 Deployment Guide: TravelGenie

This guide provides step-by-step instructions for deploying the **TravelGenie** platform to production environments.

---

## 🏗️ Deployment Overview
- **Database**: MongoDB Atlas (Cloud)
- **Backend**: Render (Node.js API)
- **Frontend**: Expo Application Services (EAS) for Android/iOS

---

## 1. Database Setup (MongoDB Atlas)

1. **Create an Account**: Sign up at [mongodb.com](https://www.mongodb.com/).
2. **Create a Cluster**: Use the **M0 Free Tier**.
3. **Database User**: Create a user with `Atlas Admin` or `Read and Write` permissions. **Save the password!**
4. **Network Access**: Add `0.0.0.0/0` to the IP Whitelist (necessary for Render unless you pay for a static IP).
5. **Connection String**: Go to "Connect" -> "Connect your application" -> "Drivers". Copy the URI.
   - It should look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/travelgenie?retryWrites=true&w=majority`

---

## 2. Backend Deployment (Render)

1. **GitHub**: Push your code to a GitHub repository.
2. **Create Web Service**: In Render Dashboard, click **New +** -> **Web Service**.
3. **Configure**:
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: (Your Atlas URI from Step 1)
   - `JWT_SECRET`: (Generate a long random string)
   - `JWT_EXPIRES_IN`: `7d`
   - `CORS_ORIGINS`: `*` (or your specific frontend domain)
   - `UPLOAD_BASE_URL`: (Your Render URL, e.g., `https://travelgenie-api.onrender.com`)

> [!CAUTION]
> **Persistent Storage**: Render's free tier uses an ephemeral file system. Files uploaded via `multer` to the `uploads/` folder will be **deleted** when the service restarts. For production, consider using **Cloudinary** or **AWS S3**.

---

## 3. Seed Production Data

Once the backend is live, you need to populate the cloud database with the initial data (districts, places, hotels).

1. Locally, update your `Backend/.env` to point to the **Atlas MONGO_URI**.
2. Run the seeding scripts:
   ```bash
   npm run db:seed-all
   npm run db:seed-transports
   npm run db:seed-admin
   ```
3. Verify data in the Atlas "Browse Collections" tab.

---

## 4. Mobile Deployment (Expo EAS)

### Step A: Update API URL
The mobile app must know where the production backend is. 
Edit `mobile/.env`:
```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url.onrender.com/api/v1
```

### Step B: Generate APK (Android)
1. **Install CLI**: `npm install -g eas-cli`
2. **Login**: `eas login`
3. **Configure**: `eas build:configure`
4. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```
   *Note: Using `--profile preview` generates an `.apk` file you can send to anyone.*
5. **Download**: Expo will provide a dashboard link once the build completes (usually 10-15 mins).

---

## 5. Pre-Viva Checklist

- [ ] **Backend Status**: Verify the Render service is "Live".
- [ ] **Database Connection**: Ensure the `MONGO_URI` is correct in Render.
- [ ] **Admin Account**: Ensure you've run `npm run db:seed-admin` against the Atlas DB.
- [ ] **API Endpoint**: Test the Render URL in a browser/Postman (e.g., `.../api/v1/districts`).
- [ ] **Mobile Build**: Test the generated APK on a real device to ensure it connects to the production API.

---

## 💡 Troubleshooting

| Issue | Solution |
|---|---|
| **Network Error in Mobile** | Ensure `EXPO_PUBLIC_API_BASE_URL` uses `https` and has no trailing slash. |
| **Login Fails** | Check if the user exists in Atlas DB. Ensure `JWT_SECRET` is set in Render. |
| **Images Not Loading** | Check if the image path is relative. Ensure `UPLOAD_BASE_URL` is set. |
| **Cold Start** | Render's free tier "sleeps" after 15 mins of inactivity. The first request may take 30-60 seconds to wake up. |
