# Screens
This directory contains all the main UI views for the TravelGenie application, organized by feature domain.

## Structure
- `/auth`: Authentication screens (Login, Register, Splash)
- `/trips`: Trip viewing and management screens
- `/transport`: User transport route board, schedule browsing, and personal transport log screens
- `/expenses`: Expense tracking and statistics screens
- `/hotels` & `/places`: Discovery and search screens
- `/admin`: Admin dashboard and CRUD screens for users, places, districts, hotels, and transport schedules
- `/profile`: User account and settings

**Guideline**: Screens should primarily focus on displaying components, handling navigation, and orchestrating data from context or API layers. Heavy UI logic should be abstracted into the `/components` folder.
