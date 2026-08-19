# Hackathon Registration System

Backend foundation for an industrial-grade, team-based hackathon registration platform.

This repository currently contains **backend architecture only**. The UI, registration flow, payments, and admin features are intentionally not implemented yet.

## Current phase

Implemented:

- Express application bootstrap (`server/app.js`)
- HTTP server lifecycle and graceful shutdown (`server/server.js`)
- MongoDB connection module
- Environment-based configuration (no hardcoded secrets)
- Health-check endpoint
- Centralized error handling and consistent API responses
- Request logging (Winston)
- Security middleware (Helmet, CORS, rate limiting)
- Layered folders for controllers, services, repositories, routes, validators, and models

Not implemented (later phases):

- Any UI (pages, CSS, React, forms, navigation)
- Team registration APIs
- Payment / QR / webhook verification
- Admin authentication and dashboard APIs
- CSV / PDF export

## Business rules (encoded for later modules)

- There is **no registration ID** requirement.
- Registration is **team-based**.
- A team may have a **variable number of participants**.
- Registration fee is **₹350 per participant**.
- Total amount is calculated on the backend only:

  `totalAmount = numberOfParticipants × 350`

- The frontend must never be trusted for payment amount.
- Payment (later) will use a dynamic payment request/QR based on the server-calculated amount and will be verified server-side via the payment gateway.

## Project structure

```text
hackathon-registration/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── utils/
│   ├── validators/
│   ├── logs/
│   ├── app.js
│   └── server.js
├── client/          # empty until the UI phase
├── .env.example
├── package.json
└── README.md
```

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Fill in real values in `.env`, especially:

   - `MONGODB_URI` (MongoDB Atlas)
   - `JWT_SECRET` (long random string)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` (for a later secure admin bootstrap)

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the API:

   ```bash
   npm run start
   ```

   For local development with file watching:

   ```bash
   npm run dev
   ```

## Health check

`GET /api/health`

Expected shape:

```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "environment": "development",
    "timestamp": "2026-08-18T13:15:00.000Z"
  }
}
```

## API response contract

Success:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": {
    "code": "ERROR_CODE"
  }
}
```

Stack traces are never returned in production.
