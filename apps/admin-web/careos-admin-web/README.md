# careOS Admin Web

Production-style React + TypeScript + Vite admin frontend for the careOS telemedicine MVP.

## Run

```bash
cd careos-admin-web
npm install
npm run dev
```

The app expects the Admin API at:

```env
VITE_ADMIN_API_URL=http://localhost:4001
```

## Admin credentials used during backend setup

```txt
admin@careos.com
Admin@12345
```

## Notes

- No fake API data is used.
- Pages consume typed hooks, not axios directly.
- Admin backend responses are normalized in API files.
- Audit logs and appointments are sourced from `/admin/dashboard` because full pagination endpoints do not exist yet.
- Unsupported future settings are shown as future-state UI only.
