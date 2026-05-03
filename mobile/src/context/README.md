# Context (Global State)
This directory manages application-wide state using React's Context API.

## Structure
- `AuthContext.js`: Manages the local persistence of JWT tokens, login states, and user sessions.
- `TripContext.js` & `ExpenseContext.js`: Caches domain data to prevent excessive loading states or prop-drilling.

**Guideline**: Use Context specifically for data that multiple disjoint branches of the UI need simultaneous access to. Avoid pushing ephemeral, single-screen view state into Context.
