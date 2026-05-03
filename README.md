<div align="center">

# ✈️ TravelGenie

### Comprehensive Travel Planning Platform for Sri Lanka

[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

TravelGenie helps users plan multi-day trips across Sri Lanka — select a district, explore places on an interactive map, choose accommodation, plan a budget, and track expenses in one seamless workflow.

🔥 **Multi-Role Support**: Switch between 🌍 **Guest Mode** (browse destinations without an account), 🎒 **User Mode** (full trip planning), and 👑 **Admin Mode** (advanced dashboard and moderation rights).

[📖 Backend Docs](Backend/README.md) · [📱 Mobile Docs](mobile/README.md)

</div>

---

## 👥 Team

| # | Registration | Feature |
|:---:|:---:|---|
| 01 | IT24100853 | Transportation & Transit Management |
| 02 | IT24100858 | Destination Management |
| 03 | IT23361690 | Trip Itinerary Management |
| 04 | IT24100533 | Hotel and Accommodation Management |
| 05 | IT24101021 | Expenses Management |
| 06 | IT24101927 | Feedback and Review System Management |

---

## ✨ Features

<details>
<summary><strong>01 · Transportation & Transit Management</strong> <em>(IT24100853)</em></summary>
<br>

- Full Create / Read / Update / Delete on transit bookings
- Admin-side transport schedule management for buses, trains, flights, ferries, taxis, and vans
- User-side route board with search, mode filters, popular route cards, and district-based schedule browsing
- Popular transport routes ranked by `popularityScore`, with fast indexes for route discovery
- Personal transport log management with estimated/actual costs, booking details, trip links, and route status

</details>

<details>
<summary><strong>02 · Destination Management</strong> <em>(IT24100858)</em></summary>
<br>

- Full CRUD for destinations and place content
- Content-based filtering driven by user preferences
- Attraction ranking via similarity scores
- Personalized destination suggestions on dashboard

</details>

<details>
<summary><strong>03 · Trip Itinerary Management</strong> <em>(IT23361690)</em></summary>
<br>

- Full CRUD for trip plans
- Guided 6-step wizard — select best options from system suggestions
- Time and activity scheduling across multiple days
- Integrated budget planning with per-category breakdowns

</details>

<details>
<summary><strong>04 · Hotel and Accommodation Management</strong> <em>(IT24100533)</em></summary>
<br>

- Full CRUD for hotel records via a modern, mobile-optimized Admin Dashboard
- Mobile-first premium Guest Screen with interactive map integration (custom zoom, reset, and pins)
- Interactive hotel and place cards with auto-scroll and visual highlighting upon map pin selection
- Seamless UI/UX design featuring custom floating tab bar interactions and premium gradient layouts
- Robust form validation and state-lock implementations for Admin inputs
- Hotel results ranked by budget, preferences, ratings, and proximity
- Supports 8 hotel categories across all Sri Lankan districts
- Multi-currency pricing display (LKR / USD / EUR)

</details>

<details>
<summary><strong>05 · Expenses Management</strong> <em>(IT24101021)</em></summary>
<br>

- Full CRUD for expense records per trip
- Estimated budget vs. actual spend comparison with visual tracking
- Historical price data stored in database
- Travel cost trend monitoring
- Automated alerts and analysis for significant price changes

</details>

<details>
<summary><strong>06 · Feedback and Review System Management</strong> <em>(IT24101927)</em></summary>
<br>

- Full CRUD for reviews
- 1–5 star ratings for places and hotels
- Like / Dislike reactions on itinerary items
- Admin moderation — approve, reject, and flag reviews

</details>

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────┐
│                 React Native App                 │
│              Expo · React Navigation             │
│                    Port 8081                     │
└─────────────────────┬────────────────────────────┘
                      │  REST API  ·  JWT Auth
┌─────────────────────▼────────────────────────────┐
│                Express Backend                   │
│       Node.js · Mongoose ODM · multer            │
│                   Port 5000                      │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│               MongoDB Database                   │
│          travelgenie  ·  collections             │
└──────────────────────────────────────────────────┘
```

---

## 🗺️ Trip Planning Workflow

```
 ① Register / Login
        │
        ▼
 ② Select District          ──  Browse all 25 districts on a map
        │
        ▼
 ③ Explore Places            ──  React Native map + place cards
        │
        ▼
 ④ Set Preferences           ──  Dates · people count · travel style
        │
        ▼
 ⑤ Pick Hotel                ──  Ranked by budget, rating, proximity
        │
        ▼
 ⑥ Set Budget                ──  Per-category breakdown (LKR / USD / EUR)
        │
        ▼
 ⑦ Confirm & Save Itinerary  ──  Stored to MongoDB trips collection
        │
        ▼
 ⑧ Track Expenses            ──  Real spend vs. budget with alerts
```

---

## 🗄️ Database

Data models managed by Mongoose:

| Category | Collections |
|---|---|
| 👤 Users | `users` |
| 🗺️ Geography | `districts`, `places` |
| 🚌 Transport | `transports`, `transportschedules` |
| 🏨 Hotels | `hotels` |
| 🧳 Trips & Budget | `trips`, `expenses` |
| ⭐ Reviews | `reviews` |
| 🔔 Notifications | `notifications` |

---

## 📁 Repository Structure

```
Travelgenie/
├── docs/                   # Architecture, API, deployment, and testing notes
├── Backend/                # Express API & MongoDB Logic
│   └── src/
│       ├── config/
│       ├── middleware/
│       ├── modules/
│       ├── routes/
│       ├── utils/
│       └── server.js
└── mobile/                 # React Native / Expo Mobile App
    └── src/
        ├── api/
        ├── components/
        ├── constants/
        ├── context/
        ├── navigation/
        ├── screens/
        └── utils/
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **MongoDB** local instance or Atlas connection

### 1 — Backend

```bash
cd Backend
npm install
```

Create a `.env` file:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/travelgenie
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=*
```

```bash
npm run dev   # → http://localhost:5000
```

Seed the database (optional, first run):

```bash
node src/scripts/seedAdmin.js       # creates admin account
node src/scripts/seedDestinations.js # seeds 25 Sri Lanka districts
node src/scripts/seedPlaces.js      # seeds places per district
node src/scripts/seedTransports.js  # seeds transport schedules
```

### 2 — Mobile App

```bash
cd mobile
npm install
```

Create a `.env` file:

```env
EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:5000/api/v1
```

> **Android emulator**: use `http://10.0.2.2:5000/api/v1` (no `.env` file needed — it is the default fallback in `src/constants/apiConfig.js`).

```bash
npm start     # Opens the Expo Metro Bundler
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend runtime | Node.js + Express | 4.18 |
| ODM | Mongoose | 8.0 |
| Database | MongoDB | 6+ |
| Authentication | JWT + bcryptjs | 9.0 / 2.4 |
| File uploads | multer | 2.0 |
| Email | nodemailer | 8.0 |
| Mobile App | React Native + Expo | 0.81 / ~54.0.0 |
| Navigation | React Navigation | 6.x |
| Maps | react-native-maps | 1.20 |

---

## 🔌 Port Reference

| Service | URL |
|---|---|
| Backend API | `http://localhost:5000` |
| Mobile dev | `http://localhost:8081` |

---

<div align="center">

Built with ❤️ for Sri Lanka 🇱🇰

</div>
