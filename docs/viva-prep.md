# TravelGenie — Team Viva Preparation

This document outlines key technical questions and answers for the individual modules of the TravelGenie system.

---

## 🚌 Transportation & Transit Management (IT24100853)

**Q1: How does the popularity-based ranking work?**
A: Every transport schedule has a `popularityScore`. The backend uses an aggregation pipeline to group schedules by district and pick the highest-ranked ones for the "Popular Routes" carousel, sorted by score and route density.

**Q2: How do you handle From/To search for transit?**
A: We use case-insensitive Regex matching on both `departureStation` and `arrivalStation` fields. We also fallback to searching the `district` and `provider` names to ensure the user finds a result even with partial names.

**Q3: What is the "Personal Transport Log"?**
A: It allows users to manually log their own transit bookings, including actual vs. estimated costs. This data is linked to a specific Trip ID, allowing the system to track real-world transit spend vs. the planned budget.

---

## 🗺️ Destination Management (IT24100858)

**Q1: How do you provide personalized destination suggestions?**
A: We use a preference-matching algorithm that compares user interests (stored in their profile) with the `tags` and `categories` of destinations in our database.

**Q2: How is the "Attraction Similarity" calculated?**
A: We use a similarity scoring system based on shared attributes like category, climate, and activities. This allows the "You might also like" section to show contextually relevant places.

---

## 🧳 Trip Itinerary Management (IT23361690)

**Q1: Explain the 6-step guided wizard logic.**
A: The `TripPlannerContext` acts as a state orchestrator. Each step (District → Places → Preferences → Hotels → Budget → Review) saves its state to the context, allowing the user to move back and forth without losing progress before final persistence.

**Q2: How do you calculate the suggested trip budget?**
A: The system aggregates the base costs of all selected hotels and estimated transit costs, then adds a buffer based on the user's selected "Preference Level" (Budget, Comfort, Luxury).

---

## 🏨 Hotel and Accommodation Management (IT24100533)

**Q1: How does the Map-to-List synchronization work?**
A: We use a combination of shared state and `ref` scrolling. Clicking a map marker updates the `selectedHotelId`, which triggers a `scrollToIndex` in the FlatList, bringing the corresponding hotel card to the top with a visual highlight.

**Q2: How are hotel results ranked?**
A: We use a multi-criteria sorting algorithm that considers price, average rating (from Member 06's module), and proximity to the user's selected trip district.

---

## 💸 Expenses & Financial Intelligence (IT24101021)

**Q1: Why separate expense summary endpoints from CRUD?**
A: CRUD handles transaction-level records while summary endpoints provide analytics. Separation improves readability, easier testing, and cleaner service logic.

**Q2: How do you handle market price benchmarks?**
A: Admins enter "Market Price Records" for various categories. The mobile app compares these benchmarks with the user's actual spending to show "Price Trends," helping travelers understand if they are overpaying compared to the local market average.

---

## ⭐ Feedback and Review System Management (IT24101927)

**Q1: How do you sync the star ratings in real-time?**
A: We have a `syncResourceRating` service that triggers on review creation, update, or deletion. It uses a MongoDB aggregation pipeline to calculate the `$avg` rating and `$count` of all 'approved' reviews for that specific Place or Hotel.

**Q2: Describe the "Report-to-Hide" moderation strategy.**
A: Reviews are approved by default for speed. However, if a review receives 3 reports, the backend automatically flips its status to `flagged` and hides it from public lists until an admin manually moderates it.

---

## 🔐 Authentication & System Core (Shared)

**Q1: How is the multi-role (Guest/User/Admin) navigation handled?**
A: We use an `AuthContext` that provides the current `user` and `role`. Based on these values, the `AppNavigator` conditionally renders the `AdminNavigator`, `MainTabNavigator` (User), or `GuestNavigator`.

**Q2: How do you secure sensitive data like passwords?**
A: We use `bcryptjs` with a salt factor of 12 for hashing passwords before they ever touch the database. For API security, we use stateless JWT tokens passed via the `Authorization` header.
