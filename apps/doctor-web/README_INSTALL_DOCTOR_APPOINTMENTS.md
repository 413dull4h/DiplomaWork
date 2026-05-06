# careOS Doctor Web — Appointments + Encounter Upgrade

Extract this ZIP directly into:

```txt
C:\Users\Abdullah AL-Mamun\OneDrive\Desktop\Deploma Work Beta\apps\doctor-web
```

It adds:

- `/dashboard`
- `/appointments`
- `/appointments/:appointmentId`
- `/appointments/:appointmentId/encounter`
- `/patients/:patientId/records`

It uses real backend routes only:

```txt
GET  /hospital/doctor/dashboard
GET  /hospital/doctor/appointments
GET  /hospital/doctor/appointments/:id
POST /hospital/doctor/appointments/:appointmentId/encounter
GET  /hospital/doctor/patients/:patientId/records
```

Run from project root:

```bat
pnpm install
pnpm --filter @careos/hospital-api dev
pnpm --filter @careos/doctor-web dev
```

Doctor Web runs on:

```txt
http://localhost:5176
```

Use a doctor account created from Hospital Web.
