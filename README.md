## Clutch Odds Mobile

Expo Router scaffold for the Clutch Odds native app.

This initial pass sets up:

- route groups for auth and app tabs
- feature folders for dashboard, arbitrage, edge center, my bets, settings, and bookmakers
- a shared API client pointed at the existing backend endpoints
- TanStack Query defaults plus a polling helper for fast-moving odds data
- Zustand + SecureStore session scaffolding

### Local setup

```bash
npm install
npm run start
```

Set `EXPO_PUBLIC_API_BASE_URL` if your backend is not running on the default simulator/device URL.
