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

# CORS
CORS_ORIGIN=http://localhost:5173

# SMTP (optional — OTP codes are always printed to terminal as fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
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
Backend/
├── config/
│   ├── db.js                # Mongoose connection
│   └── env.js               # Environment variables
├── middleware/
│   ├── auth.js              # protect() + authorize() middleware
│   ├── errorHandler.js      # Global error handler
│   ├── requestValidation.js # Input validation helpers
│   └── upload.js            # multer config (images)
├── modules/
│   ├── auth/                # Authentication & JWT logic
│   ├── users/               # Users, preferences, interests
│   ├── places/              # Destinations & places
│   ├── transport/           # Transportation & Transit Management
│   ├── hotels/              # Hotels & accommodations
│   ├── trips/               # Trip itineraries & plans
│   ├── expenses/            # Expenses & budget tracking
│   ├── reviews/             # Feedback & ratings
│   └── notifications/       # User & system notifications
├── utils/
│   ├── helpers.js           # successResponse / errorResponse
│   └── notificationEmail.js # SMTP notification sender
├── uploads/                 # Uploaded images (served as static)
└── server.js                # Express app + route mounts
```

---

## 🔌 API Reference

All endpoints are prefixed with `/api`.

> 🔓 **Public** — no token needed  
> 🔐 **Protected** — requires `Authorization: Bearer <token>`  
> 🛡️ **Admin** — requires `role: admin`

---

### 👤 Users — `/api/users`

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/register` | 🔓 | Register new user |
| `POST` | `/login` | 🔓 | Login → returns JWT |
| `POST` | `/forgot-password` | 🔓 | Send reset code to email |
| `POST` | `/verify-reset-code` | 🔓 | Verify 6-digit reset code |
| `POST` | `/reset-password` | 🔓 | Set new password |
| `POST` | `/send-verification-code` | 🔓 | Send email OTP |
| `POST` | `/verify-email-code` | 🔓 | Confirm email OTP |
| `GET` | `/profile` | 🔐 | Get own profile |
| `PUT` | `/profile` | 🔐 | Update own profile |
| `DELETE` | `/profile` | 🔐 | Delete own account |
| `PUT` | `/change-password` | 🔐 | Change password |
| `GET` | `/` | 🛡️ | List all users |
| `POST` | `/` | 🛡️ | Create user |
| `GET` | `/:id` | 🛡️ | Get user by ID |
| `PUT` | `/:id` | 🛡️ | Update user |
| `DELETE` | `/:id` | 🛡️ | Delete user |

---

### ⚙️ Preferences — `/api/preferences`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔐 | Get user preferences |
| `PUT` | `/` | 🔐 | Update user preferences |
| `GET` | `/destinations` | 🔐 | Get destination preferences |
| `PUT` | `/destinations` | 🔐 | Update destination preferences |
| `GET` | `/trip-defaults` | 🔐 | Get trip defaults |
| `PUT` | `/trip-defaults` | 🔐 | Update trip defaults |

---

### 🗺️ Districts — `/api/districts`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔓 | List all districts |
| `GET` | `/:id` | 🔓 | Get district |
| `POST` | `/` | 🛡️ | Create district |
| `PUT` | `/:id` | 🛡️ | Update district |
| `DELETE` | `/:id` | 🛡️ | Delete district |
| `POST` | `/:id/image` | 🛡️ | Upload district image |

---

### 📍 Places — `/api/places`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/search` | 🔓 | Search places |
| `GET` | `/` | 🔓 | List all places |
| `GET` | `/:id` | 🔓 | Get place |
| `POST` | `/` | 🛡️ | Create place |
| `PUT` | `/:id` | 🛡️ | Update place |
| `DELETE` | `/:id` | 🛡️ | Delete place |
| `GET` | `/:placeId/images` | 🔓 | Get place image gallery |
| `POST` | `/:placeId/images` | 🛡️ | Upload place images |
| `POST` | `/:placeId/images/url` | 🛡️ | Add image by URL |
| `DELETE` | `/images/:imageId` | 🛡️ | Delete place image |

---

### 🏖️ Destinations — `/api/destinations`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔓 | List all destinations |
| `GET` | `/popular` | 🔓 | Popular destinations |
| `GET` | `/types` | 🔓 | List destination types |
| `GET` | `/district/:districtId` | 🔓 | Destinations by district |
| `GET` | `/suggested` | 🔐 | Personalized suggestions |
| `GET` | `/suggested/:userId` | 🛡️ | Suggestions for user |
| `GET` | `/:id` | 🔓 | Get destination |
| `POST` | `/` | 🛡️ | Create destination |
| `PUT` | `/:id` | 🛡️ | Update destination |
| `DELETE` | `/:id` | 🛡️ | Delete destination |

---

### 🏨 Hotels — `/api/hotels`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔓 | List hotels (filterable) |
| `GET` | `/near` | 🔓 | Hotels near a place |
| `GET` | `/district/:districtId` | 🔓 | Hotels in district |
| `GET` | `/:id` | 🔓 | Get hotel |
| `POST` | `/` | 🛡️ | Create hotel |
| `PUT` | `/:id` | 🛡️ | Update hotel |
| `DELETE` | `/:id` | 🛡️ | Delete hotel |

---

### 🏷️ Tags — `/api/tags`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔓 | List tags (filter by `?type=`) |
| `POST` | `/` | 🛡️ | Create tag |
| `PUT` | `/:id` | 🛡️ | Update tag |
| `DELETE` | `/:id` | 🛡️ | Delete tag |
| `POST` | `/place/:placeId` | 🛡️ | Assign tags to place |

---

### 🧳 Trips — `/api/trips`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/my` | 🔐 | Get own trips |
| `GET` | `/all` | 🛡️ | Get all trips |
| `GET` | `/:id` | 🔐 | Get trip |
| `POST` | `/` | 🔐 | Create trip |
| `PUT` | `/:id` | 🔐 | Update trip |
| `DELETE` | `/:id` | 🔐 | Delete trip |

---

### 💸 Expenses — `/api/expenses`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/categories` | 🔓 | List expense categories |
| `POST` | `/categories` | 🛡️ | Create category |
| `GET` | `/admin/all` | 🛡️ | All users' expenses |
| `GET` | `/stats` | 🔐 | Expense statistics |
| `GET` | `/trip/:tripId/summary` | 🔐 | Trip expense summary |
| `GET` | `/trip/:tripId` | 🔐 | Trip expenses |
| `GET` | `/` | 🔐 | Own expenses |
| `POST` | `/` | 🔐 | Create expense |
| `GET` | `/:id` | 🔐 | Get expense |
| `PUT` | `/:id` | 🔐 | Update expense |
| `DELETE` | `/:id` | 🔐 | Delete expense |

---

### 💰 Price Records — `/api/price-records`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔐 | List price records |
| `GET` | `/place/:placeId` | 🔐 | Records for a place |
| `POST` | `/` | 🛡️ | Create record |
| `DELETE` | `/:id` | 🛡️ | Delete record |

---

### ⭐ Reviews — `/api/reviews`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/my` | 🔐 | Own reviews |
| `GET` | `/` | 🔓 | All reviews |
| `GET` | `/place/:placeId` | 🔓 | Reviews for a place |
| `GET` | `/admin/all` | 🛡️ | All reviews (admin view) |
| `POST` | `/` | 🔐 | Create review |
| `PUT` | `/:id` | 🔐 | Update review |
| `DELETE` | `/:id` | 🔐 | Delete review |
| `POST` | `/:id/helpful` | 🔐 | Mark as helpful |
| `POST` | `/:id/flag` | 🔐 | Flag review |
| `POST` | `/:id/unflag` | 🔐 | Unflag review |
| `PUT` | `/:id/status` | 🛡️ | Approve / reject |
| `POST` | `/:id/response` | 🛡️ | Add admin response |

---

### 🔔 Notifications — `/api/notifications`

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/` | 🔐 | Own notifications |
| `GET` | `/:id` | 🔐 | Get notification |
| `PUT` | `/read-all` | 🔐 | Mark all as read |
| `PUT` | `/:id/read` | 🔐 | Mark as read |
| `PUT` | `/:id` | 🔐 | Update notification |
| `DELETE` | `/:id` | 🔐 | Delete notification |
| `POST` | `/` | 🛡️ | Create notification |
| `GET` | `/admin/budget-auto-status` | 🛡️ | Budget alert status |
| `GET` | `/admin/expense-alert-status` | 🛡️ | Expense alert status |
| `GET` | `/admin/expense-alert-history` | 🛡️ | Alert history |

---

## 🔐 Authentication

Include the JWT token in all protected requests:

```http
Authorization: Bearer <your_jwt_token>
```

Tokens are valid for **7 days**. Obtain a token via `POST /api/users/login`.

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
- OTP codes are always printed to the server terminal as a fallback when SMTP is not configured.