# TravelGenie Mobile (React Native + Expo)

An integrated multi-role mobile application supporting User, Guest, and Admin workflows.

## 📱 App Navigation Flow

- 🌍 **Guest Mode (`GuestNavigator`)**: Open exploration of destinations, places, and hotels without requiring registration.
- 🎒 **User Mode (`MainTabNavigator`)**: Full access to trip planning, transport route browsing, budgeting, reviews, and profile management after logging in.
- 👑 **Admin Dashboard (`AdminNavigator`)**: Privileged access route for moderation, user management, transport schedule management, and system-wide analytics.

## 🚌 Transportation & Transit

- User transport route board with search, horizontal mode filters, popular route cards, and district-aware schedule browsing.
- User route cards share the same polished route style used across the transit screens, including price, provider, timing, booking, and service badges.
- Personal transport logs support add, edit, delete, trip linking, booking references, costs, and status tracking.
- Admin transport screens support schedule CRUD, filters, active/inactive state, `popularityScore`, booking channels, operating days, and route metadata.

## 🧳 Trip Itinerary Management (IT23361690)

- Linear Trip Planner orchestrating a smooth 5-step flow: District → Places → Preferences → Hotels → Budget.
- Persistent `TripPlannerContext` managing complex itinerary states during creation.
- Comprehensive Admin Trip Management with dedicated View and Edit screens matching the platform's design system.
- Smart itinerary editor for admins featuring date-linking, auto hotel budget calculation, and quick budget presets.

---

## 🚀 Run locally

1. Install dependencies

```bash
npm install
```

2. Configure environment

Create a `.env` file in the `mobile` folder with your backend URL:

```env
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:5000/api/v1
```

3. Start Expo

```bash
npm start
```

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run android` | Open on Android emulator/device |
| `npm run ios` | Open on iOS simulator/device |
| `npm run lint` | Run ESLint checks |
| `npm run web` | Start Expo web |

## Notes

- **Android Emulator**: Local backend is usually `http://10.0.2.2:5000/api/v1`.
- **Physical Device**: Use your computer LAN IP (e.g., `192.168.x.x`). Make sure your phone and PC are on the same Wi-Fi.
- Expo SDK is pinned to `~54.0.0`; use a matching Expo Go client.
- API requests default to `http://10.0.2.2:5000/api/v1` when no env value is set.
