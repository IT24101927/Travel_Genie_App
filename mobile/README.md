# TravelGenie Mobile (React Native + Expo)

An integrated multi-role mobile application supporting User, Guest, and Admin workflows.

## 📱 App Navigation Flow

- 🌍 **Guest Mode (`GuestNavigator`)**: Open exploration of destinations, places, and hotels without requiring registration.
- 🎒 **User Mode (`MainTabNavigator`)**: Full access to trip planning, transport route browsing, budgeting, reviews, and profile management after logging in.
- 👑 **Admin Dashboard (`AdminNavigator`)**: Privileged access route for moderation, user management, transport schedule management, and system-wide analytics.

## 🚌 Transportation & Transit

- **Advanced Transit Explorer**: Premium user board featuring an intelligent From/To search engine, horizontal mode filters, and district-aware schedule discovery.
- **Dynamic Popularity Ranking**: "Popular Routes" carousel powered by a weighted scoring system to help travelers find the most reliable transit options.
- **Polished Route Visualization**: High-fidelity "Ticket" cards displaying precise departure/arrival times, duration, provider metadata, and real-time pricing.
- **Personal Log Management**: Robust personal transit history with support for CRUD operations, trip linking, and estimated-vs-actual cost tracking.
- **Unified Booking Workflow**: Direct integration with provider booking channels (Counter, App, Web) and "Add to Trip" itinerary synchronization.
- **Admin Fleet Operations**: Dedicated mobile interface for managing complex transport schedules, popularity tuning, and operational metadata.

## 🧳 Trip Itinerary Management

- **Linear 6-Step Planner**: Orchestrating a smooth, focused flow: District → Places → Preferences → Hotels → Budget → Finalize.
- **Intelligent Budget & Duration Sync**: Dynamic recalculation of trip span based on hotel checkout dates, with manual "Return Date" editing that automatically updates budget averages.
- **Multi-Hotel Itineraries**: Support for selecting multiple hotels per trip, featuring individual night-stay badges and photo previews in the final summary.
- **Persistent Planning Drafts**: Automated state saving to local storage ensures you never lose progress if you close the app mid-plan.
- **Comprehensive Admin Trip Management**: Dedicated View and Edit screens matching the platform's design system with budget presets and date-linking.

## 💸 Expenses & Financial Intelligence

- **User Spend Analytics**: Visual dashboard for tracking trip expenses with budget health indicators.
- **Market Intelligence Flow**: Interactive Market Price Trends screen displaying real-time cost benchmarks for Accommodation, Transport, and Activities.
- **Multi-Currency Global Transparency**: Real-time currency switching (LKR, USD, EUR) across all budgeting and trend screens.
- **Admin Intel Form**: High-speed, context-aware price entry form with dynamic search for hotels and cities.
- **Automated Financial Oversight**: Admin alerts for budget-exceeding trips and platform-wide market benchmark monitoring.

## ⭐ Feedback & Review Management

- **Rich Review Submission**: Native modal-based review form with star-selection, visit date picker, and pros/cons tagging.
- **Visual Rating Breakdown**: Dynamic rating bars showing the distribution of feedback (1–5 stars) for every destination and hotel.
- **Real-Time Data Sync**: Immediate UI updates for average ratings and review counts upon approval of feedback.
- **Social Trust System**: Interaction badges for traveler types (Business, Family, etc.) and community helpfulness voting.
- **Admin Governance Dashboard**: Specialized mobile interface for flagging, approving, or rejecting user reviews to ensure platform safety.
 
## 🎨 Design System & Atomic Components
 
- **Premium UI Foundation**: A custom-built design system using a curated color palette (`colors.js`), consistent spacing, and modern typography.
- **High-Fidelity Components**: Specialized atomic components like `AppDatePicker` (with iOS spinner mode & manual formatting), `AppSelect` (custom bottom-sheet selectors), and `AppInput` for a unified, professional feel.
- **Micro-Animations**: Strategic use of `Pressable` states and `LinearGradient` to create a responsive, "alive" interface.
- **Glassmorphism & Gradients**: Modern aesthetic utilizing translucent overlays and vibrant gradients across hero sections and action cards.


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

## 🚀 Deployment & Demo (Viva)

For the final project submission and live demonstration, follow these steps:

### 1. Production API Setup
Ensure your backend is deployed (Railway/Render). Update `mobile/app.json`:
```json
"extra": {
  "apiBaseUrl": "https://your-backend.railway.app/api/v1"
}
```

### 2. Recommended: Android APK (Standalone)
Generate a permanent file that doesn't require a running laptop:
1. `npm install -g eas-cli`
2. `eas login`
3. `eas build --platform android --profile preview`
4. Download and install the `.apk` on your phone.

### 3. Quick Demo: Expo Go
1. `npx expo start --tunnel`
2. Scan the QR code. *Note: Keep your laptop awake during the demo.*

---

## 🛠️ Tech Stack
- **Framework**: React Native (Expo SDK 54)
- **Navigation**: React Navigation (Stack & Tabs)
- **Styling**: Standard StyleSheet (Custom Theme)
- **Icons**: Lucide React Native / Expo Vector Icons
- **HTTP Client**: Axios

## 📂 Structure
- `/src/components`: Reusable UI elements (cards, headers)
- `/src/screens`: Top-level page components
- `/src/context`: Global state (Auth, Trip Planning)
- `/src/navigation`: App routing logic
- `/src/constants`: Theme colors and API config
