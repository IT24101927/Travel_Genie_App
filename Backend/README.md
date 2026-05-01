<div align="center">

# ⚙️ TravelGenie — Backend API

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-8.0-880000?style=flat-square&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

REST API for the TravelGenie travel planning platform, built with Express and Mongoose on MongoDB.

[📱 Mobile Docs](../mobile/README.md) · [🏠 Project Overview](../README.md)

</div>

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js + Express | 4.18 |
| ODM | Mongoose | 8.0 |
| Database | MongoDB | 6+ |
| Auth | JWT + bcryptjs | 9.0 / 2.4 |
| File uploads | multer → `/uploads/` static | 2.0 |
| Email | nodemailer (OTP + alerts) | 8.0 |
| Dev server | nodemon | 3.0 |

---

## 🚀 Getting Started

### 1 — Install dependencies

```bash
cd Backend
npm install
```

### 2 — Create `.env` file

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/travelgenie

# Auth
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081

# SMTP (optional — OTP codes print in development and when email cannot be sent)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
SMTP_FROM=TravelGenie <your@email.com>

# Uploads
UPLOAD_BASE_URL=http://localhost:5000
```

### 3 — Start the server

```bash
npm run dev     # Development with auto-restart → http://localhost:5000
npm start       # Production
```

> The server will automatically create the MongoDB database and collections when records are saved.

---

## 📁 Project Structure

```
Backend/src/
├── config/
│   ├── db.js                # Database connection configuration
│   └── env.js               # Environment variables validation & export
├── middleware/
│   ├── authMiddleware.js    # JWT protection & roles
│   ├── errorMiddleware.js   # Global error handling
│   ├── notFoundMiddleware.js# 404 route handler
│   ├── uploadMiddleware.js  # multer config (images)
│   └── validateMiddleware.js# Input validation helpers
├── modules/
│   ├── admin/               # Admin dashboard & management
│   ├── auth/                # Authentication & JWT logic
│   ├── users/               # Users, preferences, interests
│   ├── places/              # Destinations & places
│   ├── transport/           # Transportation & Transit Management
│   ├── hotels/              # Hotels & accommodations
│   ├── trips/               # Trip itineraries & plans
│   ├── expenses/            # Expenses & budget tracking
│   ├── reviews/             # Feedback & ratings
│   └── notifications/       # User & system notifications
├── routes/
│   └── index.js             # Shared route register
├── utils/
│   ├── apiResponse.js       # Standardized response format
│   ├── appError.js          # Custom error class
│   ├── jwt.js               # Utility for tokens
│   └── mailer.js            # Email sending utility
├── app.js                   # Express app configuration
└── server.js                # API Entry point
```

---

## 🔌 API Reference

All endpoints are prefixed with `/api/v1`.

> 🔓 **Public** — no token needed  
> 🔐 **Protected** — requires `Authorization: Bearer <token>`  
> 🛡️ **Admin** — requires `role: admin`

---

### Health — `/api/v1`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/health` | 🔓 | Health check |
| `GET` | `/version` | 🔓 | API version |

---

### 🔐 Auth — `/api/v1/auth`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/register/send-code` | 🔓 | Send email verification code |
| `POST` | `/register/verify-code` | 🔓 | Verify email code |
| `POST` | `/register` | 🔓 | Register a verified user |
| `POST` | `/login` | 🔓 | Login and receive JWT |
| `POST` | `/password-reset/request` | 🔓 | Request password reset code |
| `POST` | `/password-reset/verify-code` | 🔓 | Verify password reset code |
| `POST` | `/password-reset/reset` | 🔓 | Set a new password |
| `GET` | `/me` | 🔐 | Get authenticated user |

---

### 👤 Users — `/api/v1/users`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/me` | 🔐 | Get own profile |
| `PUT` | `/me` | 🔐 | Update own profile and optional profile image |
| `POST` | `/me/change-password` | 🔐 | Change own password |
| `DELETE` | `/me` | 🔐 | Delete own account |

---

### 👑 Admin — `/api/v1/admin`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/login` | 🔓 | Admin dedicated login |
| `GET` | `/stats` | 🛡️ | Dashboard global statistics |
| `GET` | `/users` | 🛡️ | Comprehensive user list |
| `POST` | `/users` | 🛡️ | Provision a new user |
| `PUT` | `/users/:id` | 🛡️ | Edit user data / roles |
| `POST` | `/users/:id/reset-password` | 🛡️ | Force reset user password |
| `DELETE` | `/users/:id` | 🛡️ | Purge user account |
| `GET` | `/resources/:resource` | 🛡️ | Generic collection list access |

---

### 🗺️ Districts — `/api/v1/districts`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔓 | List all districts |
| `GET` | `/:id` | 🔓 | Get district |
| `POST` | `/` | 🛡️ | Create district |
| `PUT` | `/:id` | 🛡️ | Update district |
| `DELETE` | `/:id` | 🛡️ | Delete district |
| `POST` | `/upload` | 🛡️ | Upload district image |

---

### 📍 Places — `/api/v1/places`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔓 | List and search places |
| `GET` | `/:id` | 🔓 | Get place |
| `POST` | `/` | 🛡️ | Create place |
| `PUT` | `/:id` | 🛡️ | Update place |
| `DELETE` | `/:id` | 🛡️ | Delete place |

---

### 🏨 Hotels — `/api/v1/hotels`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔓 | List hotels (filterable) |
| `GET` | `/:id` | 🔓 | Get hotel |
| `POST` | `/` | 🛡️ | Create hotel |
| `PUT` | `/:id` | 🛡️ | Update hotel |
| `DELETE` | `/:id` | 🛡️ | Delete hotel |

---

### 🧳 Trips — `/api/v1/trips`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/` | 🔐 | Create trip |
| `GET` | `/` | 🔐 | Get own trips |
| `GET` | `/:id` | 🔐 | Get trip |
| `PUT` | `/:id` | 🔐 | Update trip |
| `DELETE` | `/:id` | 🔐 | Delete trip |

---

### 💸 Expenses — `/api/v1/expenses`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/summary/user-total` | 🔐 | Total spend for current user |
| `GET` | `/summary/recent` | 🔐 | Recent expenses |
| `GET` | `/summary/trip/:tripId` | 🔐 | Total spend for one trip |
| `GET` | `/summary/budget-usage/:tripId` | 🔐 | Budget usage percentage |
| `GET` | `/` | 🔐 | Own expenses |
| `POST` | `/` | 🔐 | Create expense |
| `GET` | `/:id` | 🔐 | Get expense |
| `PUT` | `/:id` | 🔐 | Update expense |
| `DELETE` | `/:id` | 🔐 | Delete expense |

---

### ⭐ Reviews — `/api/v1/reviews`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/my` | 🔐 | Own reviews |
| `GET` | `/` | 🔓 | All reviews |
| `GET` | `/place/:placeId` | 🔓 | Reviews for a place |
| `GET` | `/admin/all` | 🛡️ | All reviews (admin view) |
| `GET` | `/:id` | 🔓 | Get review |
| `POST` | `/` | 🔐 | Create review |
| `PUT` | `/:id` | 🔐 | Update own review |
| `DELETE` | `/:id` | 🔐 | Delete own review |

---

### 🔔 Notifications — `/api/v1/notifications`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔐 | Own notifications |
| `PATCH` | `/:id/read` | 🔐 | Mark as read |
| `DELETE` | `/:id` | 🔐 | Delete notification |
| `POST` | `/` | 🛡️ | Create notification |

---

### 🚌 Transport — `/api/v1/transport`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/schedule-districts` | 🔐 | Popular active transport districts, grouped from schedules |
| `GET` | `/schedules` | 🔐 | Active public schedules with search, type, district, province, from/to, and pagination filters |
| `POST` | `/` | 🔐 | Create transport booking |
| `GET` | `/` | 🔐 | List own transport bookings |
| `GET` | `/:id` | 🔐 | Get transport booking |
| `PUT` | `/:id` | 🔐 | Update transport booking |
| `DELETE` | `/:id` | 🔐 | Delete transport booking |

### 🚌 Admin Transport Schedules — `/api/v1/admin/transports`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/` | 🛡️ | Create a transport schedule |
| `GET` | `/` | 🛡️ | List schedules with search, type, district, province, from/to, and pagination filters |
| `GET` | `/:id` | 🛡️ | Get one schedule |
| `PUT` | `/:id` | 🛡️ | Update schedule details, active state, booking channel, and popularity score |
| `DELETE` | `/:id` | 🛡️ | Delete a schedule |

---

## 🔐 Authentication

Include the JWT token in all protected requests:

```http
Authorization: Bearer <your_jwt_token>
```

Tokens are valid for **7 days** by default. Obtain a token via `POST /api/v1/auth/login`.

---

## ❌ Error Format

All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

| Code | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Missing or invalid token |
| `403` | Insufficient role (admin required) |
| `404` | Resource not found |
| `500` | Internal server error |

---

## 🗄️ Database Notes

- **MongoDB Collections**: All data models map to standard MongoDB collections via Mongoose.
- Creating or updating an expense automatically triggers a `BUDGET_100` notification when spend reaches 100% of trip budget.
- Ratings and reviews are embedded or cross-referenced correctly based on the Place schema.
- OTP codes are printed to the server terminal in development, and as a fallback when SMTP is not configured.
