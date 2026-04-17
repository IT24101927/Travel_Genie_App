# MongoDB Schema Summary

## User

- `fullName` (String)
- `email` (String, unique)
- `password` (String, hashed)
- `role` (user|admin)
- `phone` (String)
- `profileImage` (String)

## Trip

- `userId` (ObjectId -> User)
- `title` (String)
- `destination` (String)
- `startDate` (Date)
- `endDate` (Date)
- `budget` (Number)
- `notes` (String)
- `status` (planned|ongoing|completed|cancelled)

## Place

- `name` (String)
- `district` (String)
- `category` (String)
- `description` (String)
- `image` (String)
- `tags` ([String])
- `estimatedCost` (Number)
- `createdBy` (ObjectId -> User)

## Hotel

- `name` (String)
- `location` (String)
- `priceRange` (Number)
- `rating` (Number)
- `description` (String)
- `image` (String)
- `amenities` ([String])
- `createdBy` (ObjectId -> User)

## Expense (Owned Module)

- `userId` (ObjectId -> User)
- `tripId` (ObjectId -> Trip)
- `category` (transport|food|hotel|activity|shopping|other)
- `amount` (Number)
- `date` (Date)
- `paymentMethod` (cash|card|wallet|bank_transfer|other)
- `tags` ([String])
- `notes` (String)

## Review

- `userId` (ObjectId -> User)
- `targetType` (place|hotel)
- `targetId` (ObjectId)
- `rating` (1..5)
- `comment` (String)

## Notification

- `userId` (ObjectId -> User)
- `title` (String)
- `message` (String)
- `isRead` (Boolean)
