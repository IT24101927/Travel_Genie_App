# TravelGenie System Architecture

## Components

- Mobile frontend: React Native + Expo (`mobile/`)
- Backend API: Node.js + Express + Mongoose (`Backend/src/`)
- Database: MongoDB Atlas

## Feature Ownership Highlight

- Transportation & Transit Management (`IT24100853`) includes the admin transport schedule CRUD flow, user route discovery board, popular transport cards, district schedule browsing, and personal transport logs.

## Request Flow

1. User action in mobile app
2. Axios request sent to hosted backend API
3. Backend route + validation middleware
4. Auth middleware verifies JWT for protected routes
5. Controller calls service layer
6. Service reads/writes MongoDB via Mongoose models
7. Standard JSON response returned to app

## Security Model

- Password hashing with bcryptjs
- JWT-based stateless authentication
- Protected routes using `protect` middleware
- Role checks using `authorize('admin')`
- Input validation using express-validator
- Upload validation via Multer middleware

## Assignment Compliance Summary

- React Native frontend: yes
- Express backend: yes
- MongoDB + Mongoose: yes
- RESTful APIs: yes
- Middleware and error handling: yes
- Auth + protected routes: yes
- File upload with Multer: yes
- Hosted API compatibility: yes
