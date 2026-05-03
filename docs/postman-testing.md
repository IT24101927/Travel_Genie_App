# Postman Testing Checklist

## Setup

1. Create environment variable: `baseUrl`
2. Set `baseUrl` to `http://localhost:5000/api/v1` or hosted URL
3. Keep `token` variable empty initially

## Auth Tests

1. Register: `POST {{baseUrl}}/auth/register`
2. Login: `POST {{baseUrl}}/auth/login`
3. Save token to `token`
4. Auth me: `GET {{baseUrl}}/auth/me` with `Bearer {{token}}`

## Trip Tests

1. Create trip
2. List trips
3. Update trip
4. Delete trip

## Expense Tests (Important)

1. Create expense with a valid `tripId`
2. List expenses by user
3. Update expense amount/category
4. Delete expense
5. Summary checks:
   - `GET /expenses/summary/user-total`
   - `GET /expenses/summary/recent?limit=5`
   - `GET /expenses/summary/trip/:tripId`
   - `GET /expenses/summary/budget-usage/:tripId`

## Expected Status Codes

- `201` created
- `200` success
- `400` validation
- `401` unauthenticated
- `403` unauthorized role/access
- `404` not found
- `409` conflict (e.g., duplicate email)
- `500` server error
