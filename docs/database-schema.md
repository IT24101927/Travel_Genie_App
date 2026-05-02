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
- `type` (String)
- `description` (String)
- `image_url` (String)
- `tags` ([String])
- `estimatedCost` (Number)
- `createdBy` (ObjectId -> User)

## Hotel

- `name` (String)
- `location` (String)
- `price_per_night` (Number)
- `rating` (Number)
- `description` (String)
- `image_url` (String)
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

## Transport

- `userId` (ObjectId -> User)
- `tripId` (ObjectId -> Trip, optional)
- `type` (tuk-tuk|pickme|uber|public-bus|express-bus|intercity-train|private-van|scooter-rent|domestic-flight|ferry|taxi|other)
- `fromLocation` (String)
- `toLocation` (String)
- `departureDate` (Date)
- `arrivalDate` (Date, optional)
- `provider` (String)
- `bookingRef` (String)
- `seatInfo` (String)
- `bookingMethod` (app|counter|direct|website|negotiated)
- `estimatedCost` (Number)
- `actualCost` (Number)
- `currency` (String, default LKR)
- `status` (upcoming|completed|cancelled)
- `notes` (String)

## TransportSchedule

- `district_id` (Number)
- `district` (String)
- `province` (String)
- `type` (public-bus|express-bus|intercity-train|domestic-flight|ferry|taxi|private-van|other)
- `routeName` (String)
- `routeNo` (String)
- `provider` (String)
- `serviceClass` (String)
- `departureStation` (String)
- `arrivalStation` (String)
- `departureTime` (String, HH:mm)
- `arrivalTime` (String, HH:mm)
- `duration` (Number)
- `ticketPriceLKR` (Number)
- `operatingDays` ([String])
- `bookingChannel` (official-online|authorized-online|mobile-app|counter|onboard-cash|hotline|airport-counter|local-check)
- `contactNumber` (String)
- `bookingUrl` (String)
- `paymentNotes` (String)
- `bookingTips` (String)
- `tags` ([String])
- `popularityScore` (Number)
- `isActive` (Boolean)

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
