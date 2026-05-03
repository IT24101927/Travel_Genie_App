# Navigation
This directory contains the routing and navigation hierarchy for the application using React Navigation.

## Structure
- `RootNavigator.js`: The top-level navigator that orchestrates between the Auth flow (unauthenticated) and Main Tab flow (authenticated).
- `AuthNavigator.js`: Stack navigator for Login, Register, and Splash screens.
- `MainTabNavigator.js`: Bottom tab navigator serving as the primary shell of the application, including the user Transport tab.
- `AdminNavigator.js`: Admin stack for dashboard management screens, including transport schedule CRUD.
- `*StackNavigator.js`: Nested slice-specific navigators (e.g. for Expenses).
