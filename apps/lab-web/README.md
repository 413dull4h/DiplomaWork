# careOS Lab Web

Production-style Lab Admin frontend for careOS.

## Real backend routes used

Implemented and wired:

```txt
POST /lab/auth/login
GET  /lab/auth/me
GET  /lab/profile
GET  /lab/tests
POST /lab/tests
PATCH /lab/tests/:id
GET  /lab/orders
GET  /lab/orders/:id
PATCH /lab/orders/:id/accept
PATCH /lab/orders/:id/reject
PATCH /lab/orders/:id/sample-collected
PATCH /lab/orders/:id/in-progress
PATCH /lab/orders/:id/complete
POST /lab/orders/:orderId/reports
GET  /lab/orders/:orderId/reports
GET  /lab/reports/:id
```

Routes intentionally not faked:

```txt
PATCH /lab/profile
GET /lab/dashboard
GET /lab/tests/:id
DELETE /lab/tests/:id
GET /lab/reports
GET /lab/notifications
PATCH /lab/notifications/:id/read
PATCH /lab/notifications/read-all
```

Notes:
- Dashboard is derived from real `/lab/tests` and `/lab/orders`.
- Reports list is derived from real `/lab/orders` because global `GET /lab/reports` does not exist.
- Test detail is derived from `/lab/tests` because `GET /lab/tests/:id` does not exist.
- Disable test uses `PATCH /lab/tests/:id` with `isActive=false` because delete route does not exist.

## Setup

Create `.env`:

```env
VITE_LAB_API_URL=http://localhost:4004
```

Install and run from repo root:

```bat
pnpm install
pnpm --filter @careos/lab-web dev
```

Open:

```txt
http://localhost:5177
```

Login:

```txt
lab.admin@careos.com
Lab@12345
```
