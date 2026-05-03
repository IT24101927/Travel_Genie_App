# TravelGenie API Endpoints (v1)

Base URL: `https://<your-backend-domain>/api/v1`

## 🔐 Auth

- `POST /auth/register/send-code` - Send email verification code
- `POST /auth/register/verify-code` - Verify email code
- `POST /auth/register` - Register verified user
- `POST /auth/login` - Login user
- `POST /auth/password-reset/request` - Request password reset code
- `POST /auth/password-reset/verify-code` - Verify password reset code
- `POST /auth/password-reset/reset` - Set a new password
- `GET /auth/me` - Get authenticated user (protected)

## 👤 Users

- `GET /users/me` - View profile (protected)
- `PUT /users/me` - Update profile + optional image upload (protected)
- `POST /users/me/change-password` - Change password (protected)
- `DELETE /users/me` - Delete account (protected)

## 🧳 Trips

- `POST /trips` - Create trip (protected)
- `GET /trips` - Get user trips (protected)
- `GET /trips/:id` - Get single trip (protected)
- `PUT /trips/:id` - Update trip (protected)
- `DELETE /trips/:id` - Delete trip (protected)

## 📍 Places

- `GET /places` - List/search places
- `GET /places/:id` - Get place by id
- `POST /places` - Create place (admin)
- `PUT /places/:id` - Update place (admin)
- `DELETE /places/:id` - Delete place (admin)

## 🏨 Hotels

- `GET /hotels` - List/filter hotels
- `GET /hotels/:id` - Get hotel by id
- `POST /hotels` - Create hotel (admin)
- `PUT /hotels/:id` - Update hotel (admin)
- `DELETE /hotels/:id` - Delete hotel (admin)

## 💸 Expenses

- `POST /expenses` - Create expense (protected)
- `GET /expenses` - List expenses (protected)
- `GET /expenses/:id` - Get expense by id (protected)
- `PUT /expenses/:id` - Update expense (protected)
- `DELETE /expenses/:id` - Delete expense (protected)

### 📊 Expense Summary Endpoints

- `GET /expenses/summary/user-total` - Total user expenses
- `GET /expenses/summary/recent?limit=5` - Recent expenses
- `GET /expenses/summary/trip/:tripId` - Total trip expenses
- `GET /expenses/summary/budget-usage/:tripId` - Budget usage percentage

## ⭐ Reviews

- `GET /reviews` - List reviews
- `GET /reviews/:id` - Get review
- `GET /reviews/admin/all` - Admin review list (admin)
- `POST /reviews` - Add review (protected)
- `PUT /reviews/:id` - Update own review/admin
- `DELETE /reviews/:id` - Delete own review/admin

## 🔔 Notifications

- `GET /notifications` - List notifications (protected)
- `PATCH /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification
- `POST /notifications` - Create notification (admin)

## 🚌 Transport

- `POST /transport` - Create transport booking (protected)
- `GET /transport` - List own transport bookings (protected)
- `GET /transport/:id` - Get booking by id (protected)
- `PUT /transport/:id` - Update booking (protected)
- `DELETE /transport/:id` - Delete booking (protected)

## 👑 Admin

- `POST /admin/login` - Admin dedicated login
- `GET /admin/stats` - Global dashboard statistics (admin)
- `GET /admin/users` - View all users (admin)
- `POST /admin/users` - Provision a new user (admin)
- `PUT /admin/users/:id` - Edit user roles (admin)
- `DELETE /admin/users/:id` - Delete user account (admin)
- `GET /admin/resources/:resource` - Get any resource dynamically (admin)
