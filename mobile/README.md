# TravelGenie Mobile (React Native + Expo)

An integrated multi-role mobile application supporting User, Guest, and Admin workflows.

## 📱 App Navigation Flow

- 🌍 **Guest Mode (`GuestNavigator`)**: Open exploration of destinations, places, and hotels without requiring registration.
- 🎒 **User Mode (`MainTabNavigator`)**: Full access to trip planning, budgeting, reviews, and profile management after logging in.
- 👑 **Admin Dashboard (`AdminNavigator`)**: Privileged access route for moderation, user management, and viewing system-wide analytics.

---

## 🚀 Run locally
   ```bash
   npm install
   ```

2. Configure Environment
   Create a `.env` file in the `mobile` folder with your backend URL:
   ```env
   EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:5000/api/v1
   ```

3. Start Expo
   ```bash
   npx expo start --clear
   ```

## Notes

- **Android Emulator**: Local backend is usually `http://10.0.2.2:5000/api/v1`.
- **Physical Device**: Use your computer LAN IP (e.g., `192.168.x.x`). Make sure your phone and PC are on the same Wi-Fi.
- We utilize Expo SDK ~54.0.0 for physical device backwards compatibility. Validate your SDK version matches the target device's Expo Go client.
