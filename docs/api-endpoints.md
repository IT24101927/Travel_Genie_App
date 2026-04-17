# TravelGenie API Endpoints (v1)

Base URL: `https://<your-backend-domain>/api/v1`

## Auth

- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get authenticated user (protected)

## Users

- `GET /users/me` - View profile (protected)
- `PUT /users/me` - Update profile + optional image upload (protected)

## Trips

- `POST /trips` - Create trip (protected)
- `GET /trips` - Get user trips (protected)
- `GET /trips/:id` - Get single trip (protected)
- `PUT /trips/:id` - Update trip (protected)
- `DELETE /trips/:id` - Delete trip (protected)

## Places

- `GET /places` - List/search places
- `GET /places/:id` - Get place by id
- `POST /places` - Create place (admin)
- `PUT /places/:id` - Update place (admin)
- `DELETE /places/:id` - Delete place (admin)

## Hotels

- `GET /hotels` - List/filter hotels
- `GET /hotels/:id` - Get hotel by id
- `POST /hotels` - Create hotel (admin)
- `PUT /hotels/:id` - Update hotel (admin)
- `DELETE /hotels/:id` - Delete hotel (admin)

## Expenses

- `POST /expenses` - Create expense (protected)
- `GET /expenses` - List expenses (protected)
- `GET /expenses/:id` - Get expense by id (protected)
- `PUT /expenses/:id` - Update expense (protected)
- `DELETE /expenses/:id` - Delete expense (protected)

### Expense Summary Endpoints

- `GET /expenses/summary/user-total` - Total user expenses
- `GET /expenses/summary/recent?limit=5` - Recent expenses
- `GET /expenses/summary/trip/:tripId` - Total trip expenses
- `GET /expenses/summary/budget-usage/:tripId` - Budget usage percentage

## Reviews

- `GET /reviews` - List reviews
- `GET /reviews/:id` - Get review
- `GET /reviews/admin/all` - Admin review list (admin)
- `POST /reviews` - Add review (protected)
- `PUT /reviews/:id` - Update own review/admin
- `DELETE /reviews/:id` - Delete own review/admin

## Notifications

- `GET /notifications` - List notifications (protected)
- `PATCH /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification
- `POST /notifications` - Create notification (admin)

## Optional AI

- `POST /ai/recommendations/*` - Proxied recommendation endpoints (optional)
