# API (Network Layer)
This directory isolates all external network requests to the backend API.

## Structure
- Exports standard functions utilizing `axios` or `fetch` for each domain (e.g. `authApi.js`, `tripApi.js`, `expenseApi.js`).
- Encapsulates authorization token injection and endpoint routing.
- `transportApi.js` contains both user transport log calls and schedule browsing/admin schedule helpers.

**Guideline**: Components or Hooks should never make raw `fetch` or `axios` calls directly to the server. All interface boundaries with the Backend API must pass through this layer.
