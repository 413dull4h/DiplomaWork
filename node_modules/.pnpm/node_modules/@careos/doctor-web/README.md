# careOS Doctor Web

Hospital-scoped Doctor Profile frontend for careOS.

This app is intentionally limited to doctor authentication, doctor profile viewing/editing, hospital assignment display, schedule viewing, language preference, settings, and logout. It does not build marketplace doctor features, lab, pharmacy, or payment modules.

## Install

Extract this folder into:

```txt
apps/doctor-web
```

From the careOS project root:

```bash
pnpm install
pnpm --filter @careos/doctor-web dev
```

Doctor Web runs on:

```txt
http://localhost:5176
```

## Required environment file

Create:

```txt
apps/doctor-web/.env
```

Paste:

```env
VITE_HOSPITAL_API_URL=http://localhost:4002
```

Restart Vite after creating or editing `.env`.

## Test login

```txt
Email: doctor.ahmed@careos.com
Password: Doctor@12345
```

## Expected backend routes

```txt
POST /hospital/doctor-auth/login
GET  /hospital/doctor-auth/me
GET  /hospital/doctor/profile
PATCH /hospital/doctor/profile
GET  /hospital/doctor/availability
PATCH /hospital/doctor/availability/:id
```

## Included updates

- Premium careOS-style glass layout aligned closer to the Admin/Hospital/Patient UI direction.
- Language selector in Login, Topbar, and Settings.
- Supported UI language preference options: English, Bangla, Russian, Arabic, Chinese, French, German, Spanish.
- Doctor professional Languages and Qualifications sections are displayed when backend returns those fields.
- Editing languages/qualifications is intentionally locked until backend supports those fields.
- Fixed React Hook Form custom input ref forwarding.

## Backend notes

- `GET /hospital/doctor/profile` is used as the source of truth for doctor profile, hospital assignment, department assignment, and availability summary.
- `PATCH /hospital/doctor/profile` is used only for editable doctor fields.
- Phone, languages, and qualifications are shown only when returned by the backend. Editing those requires backend support.
- `GET /hospital/doctor/availability` may not exist in your current backend. The schedule page shows a clear missing-endpoint state instead of silently faking data.
- Raw JWT tokens are never shown in the UI.
