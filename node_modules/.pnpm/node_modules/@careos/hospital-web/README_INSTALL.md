# careOS Hospital Web — Doctor Account Creation Upgrade

This upgrade adds a hospital-admin UI for creating a hospital-scoped doctor login.

## What it adds

- `src/api/doctorAccounts.ts`
- `src/hooks/useDoctorAccounts.ts`
- `src/types/doctorAccount.ts`
- `src/components/doctors/CreateDoctorAccountModal.tsx`
- `src/components/doctors/DoctorAccountPanel.tsx`
- `PATCH_EXAMPLE_DoctorDetailsPage.tsx`

## Backend route used

```txt
POST /hospital/doctors/:hospitalDoctorId/account
```

Payload:

```json
{
  "email": "doctor.ahmed@careos.com",
  "password": "Doctor@12345",
  "phone": "+8801722222222"
}
```

## Install

Extract this ZIP into:

```txt
C:\Users\Abdullah AL-Mamun\OneDrive\Desktop\Deploma Work Beta\apps\hospital-web
```

It should merge into the existing `src` folder.

## Important import expectation

`src/api/doctorAccounts.ts` expects your existing hospital web API client to export:

```ts
export const apiClient = ...
```

from:

```txt
src/api/client.ts
```

If your file exports a different name, open `src/api/doctorAccounts.ts` and change:

```ts
import { apiClient } from './client'
```

Example alternatives:

```ts
import { api } from './client'
```

Then replace `apiClient.post` with `api.post`.

## Wire into your doctor detail page

Find your Hospital Web doctor detail page. Common names may be:

```txt
src/pages/DoctorsPage.tsx
src/pages/DoctorDetailsPage.tsx
src/features/doctors/DoctorDetailsPage.tsx
src/features/doctors/DoctorsPage.tsx
```

Add:

```tsx
import { DoctorAccountPanel } from '../components/doctors/DoctorAccountPanel'
```

or adjust the path based on your file location.

Then render:

```tsx
<DoctorAccountPanel hospitalDoctor={hospitalDoctor} onCreated={() => refetch?.()} />
```

The `hospitalDoctor` object must include:

```ts
{
  id: string,
  doctor: {
    id: string,
    fullName: string,
    userId?: string | null
  },
  department?: {
    id: string,
    name: string
  }
}
```

## Run

From project root:

```bat
pnpm install
pnpm --filter @careos/hospital-web dev
```

Make sure Hospital API is running:

```bat
pnpm --filter @careos/hospital-api dev
```

Login to Hospital Web:

```txt
hospital.admin@careos.com
Hospital@12345
```

Then go to Doctors and open/create a doctor login.
