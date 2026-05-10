import { useEffect, useState } from 'react'
import { Building2, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import {
  EmptyState,
  ErrorState,
  Field,
  GlassCard,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from '../../components/common/Basic'
import { useAuthStore } from '../../store/authStore'
import { useDepartments } from '../../hooks/useDepartments'
import { useDoctors } from '../../hooks/useDoctors'

const HOSPITAL_API_URL =
  import.meta.env.VITE_HOSPITAL_API_URL || 'http://localhost:4002'

type HospitalLocationForm = {
  name: string
  description: string
  phone: string
  email: string
  isMain: boolean
  isActive: boolean
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  latitude: string
  longitude: string
}

const emptyLocationForm: HospitalLocationForm = {
  name: '',
  description: '',
  phone: '',
  email: '',
  isMain: false,
  isActive: true,
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Bangladesh',
  latitude: '',
  longitude: '',
}

function cleanOptional(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function formatLocationAddress(location?: any) {
  const address = location?.address

  if (!address) {
    return '—'
  }

  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ')
}

function getLocationCoordinates(location?: any) {
  const address = location?.address

  const latitude =
    typeof address?.latitude === 'string'
      ? Number(address.latitude)
      : address?.latitude

  const longitude =
    typeof address?.longitude === 'string'
      ? Number(address.longitude)
      : address?.longitude

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    Number.isNaN(latitude) ||
    Number.isNaN(longitude)
  ) {
    return null
  }

  return {
    latitude,
    longitude,
  }
}

function getLocationMapUrl(location?: any) {
  const coords = getLocationCoordinates(location)

  if (coords) {
    return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
  }

  const address = formatLocationAddress(location)

  if (!address || address === '—') {
    return null
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`
}

function getLocationDirectionsUrl(location?: any) {
  const coords = getLocationCoordinates(location)

  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`
  }

  const address = formatLocationAddress(location)

  if (!address || address === '—') {
    return null
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address
  )}`
}

function openLocationUrl(url?: string | null) {
  if (!url) {
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

function LocationMapPreview({ location }: { location: any }) {
  const coords = getLocationCoordinates(location)

  if (!coords) {
    return (
      <div className="grid min-h-[190px] place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/40 p-5 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5">
        Add latitude and longitude to preview this building on the map.
      </div>
    )
  }

  const embedUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&z=15&output=embed`

  return (
    <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
      <iframe
        title={`${location.name} map`}
        src={embedUrl}
        className="h-[220px] w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}

function LocationButtons({ location }: { location: any }) {
  const mapUrl = getLocationMapUrl(location)
  const directionsUrl = getLocationDirectionsUrl(location)

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={!mapUrl}
        onClick={() => openLocationUrl(mapUrl)}
      >
        Open Map
      </Button>

      <Button
        type="button"
        variant="secondary"
        disabled={!directionsUrl}
        onClick={() => openLocationUrl(directionsUrl)}
      >
        Get Directions
      </Button>
    </div>
  )
}

function LocationSummaryCard({
  location,
  onEdit,
  onDelete,
  deleting,
}: {
  location: any
  onEdit: (location: any) => void
  onDelete: (locationId: string) => void
  deleting: boolean
}) {
  const departments = location.departments || []
  const doctors = location.doctors || []

  return (
    <GlassCard>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-600" />

              <h3 className="text-xl font-black dark:text-white">
                {location.name}
              </h3>

              {location.isMain ? <StatusBadge value="MAIN" /> : null}

              <StatusBadge value={location.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {formatLocationAddress(location)}
            </p>

            {location.description ? (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {location.description}
              </p>
            ) : null}

            <p className="mt-2 text-xs text-slate-500">
              {location.phone || 'No phone'} · {location.email || 'No email'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onEdit(location)}
            >
              Edit
            </Button>

            <Button
              type="button"
              variant="danger"
              disabled={deleting}
              onClick={() => onDelete(location.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <LocationMapPreview location={location} />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl bg-white/50 p-4 dark:bg-white/5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Departments in this building
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {departments.length
                ? departments.map((department: any) => department.name).join(', ')
                : 'No departments assigned yet'}
            </p>
          </div>

          <div className="rounded-3xl bg-white/50 p-4 dark:bg-white/5">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Doctors in this building
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {doctors.length
                ? doctors
                    .map((doctorItem: any) => doctorItem.doctor?.fullName)
                    .filter(Boolean)
                    .join(', ')
                : 'No doctors assigned directly yet'}
            </p>
          </div>
        </div>

        <LocationButtons location={location} />
      </div>
    </GlassCard>
  )
}

export function LocationsPage() {
  const token = useAuthStore((state) => state.token)
  const departments = useDepartments()
  const doctors = useDoctors()

  const [locations, setLocations] = useState<any[]>([])
  const [form, setForm] = useState<HospitalLocationForm>(emptyLocationForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  function authHeaders(extra?: HeadersInit): HeadersInit {
    return {
      ...(extra || {}),
      Authorization: `Bearer ${token}`,
    }
  }

  async function readJson(response: Response) {
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data?.message || 'Request failed.')
    }

    return data
  }

  async function fetchLocations() {
    if (!token) {
      setErr('Missing hospital token. Please log in again.')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErr('')

      const response = await fetch(`${HOSPITAL_API_URL}/hospital/locations`, {
        headers: authHeaders(),
      })

      const data = await readJson(response)
      setLocations(data.locations || [])
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Failed to load locations.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  function updateForm(key: keyof HospitalLocationForm, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyLocationForm)
    setErr('')
    setMsg('')
  }

  function startEdit(location: any) {
    setEditingId(location.id)
    setErr('')
    setMsg('')

    setForm({
      name: location.name || '',
      description: location.description || '',
      phone: location.phone || '',
      email: location.email || '',
      isMain: Boolean(location.isMain),
      isActive: location.isActive !== false,
      line1: location.address?.line1 || '',
      line2: location.address?.line2 || '',
      city: location.address?.city || '',
      state: location.address?.state || '',
      postalCode: location.address?.postalCode || '',
      country: location.address?.country || 'Bangladesh',
      latitude:
        location.address?.latitude != null
          ? String(location.address.latitude)
          : '',
      longitude:
        location.address?.longitude != null
          ? String(location.address.longitude)
          : '',
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      description: cleanOptional(form.description),
      phone: cleanOptional(form.phone),
      email: cleanOptional(form.email),
      isMain: form.isMain,
      isActive: form.isActive,
      address: {
        line1: form.line1.trim(),
        line2: cleanOptional(form.line2),
        city: form.city.trim(),
        state: cleanOptional(form.state),
        postalCode: cleanOptional(form.postalCode),
        country: form.country.trim(),
        latitude: form.latitude.trim() ? Number(form.latitude) : undefined,
        longitude: form.longitude.trim() ? Number(form.longitude) : undefined,
      },
    }
  }

  async function saveLocation() {
    if (!token) {
      setErr('Missing hospital token. Please log in again.')
      return
    }

    if (
      !form.name.trim() ||
      !form.line1.trim() ||
      !form.city.trim() ||
      !form.country.trim()
    ) {
      setErr('Building name, address line 1, city, and country are required.')
      return
    }

    try {
      setIsSaving(true)
      setErr('')
      setMsg('')

      const url = editingId
        ? `${HOSPITAL_API_URL}/hospital/locations/${editingId}`
        : `${HOSPITAL_API_URL}/hospital/locations`

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: authHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(buildPayload()),
      })

      await readJson(response)

      setMsg(
        editingId
          ? 'Hospital location updated successfully.'
          : 'Hospital location created successfully.'
      )

      resetForm()
      await fetchLocations()
      void departments.refetch()
      void doctors.refetch()
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Failed to save location.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteLocation(locationId: string) {
    if (!token) {
      setErr('Missing hospital token. Please log in again.')
      return
    }

    if (
      !window.confirm(
        'Delete this hospital location? Departments and doctors should be moved first.'
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)
      setErr('')
      setMsg('')

      const response = await fetch(
        `${HOSPITAL_API_URL}/hospital/locations/${locationId}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
        }
      )

      await readJson(response)
      setMsg('Hospital location deleted successfully.')
      await fetchLocations()
      void departments.refetch()
      void doctors.refetch()
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Failed to delete location.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function assignDepartmentLocation(
    departmentId: string,
    locationId: string
  ) {
    if (!token) {
      setErr('Missing hospital token. Please log in again.')
      return
    }

    try {
      setErr('')
      setMsg('')

      const response = await fetch(
        `${HOSPITAL_API_URL}/hospital/departments/${departmentId}/location`,
        {
          method: 'PATCH',
          headers: authHeaders({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            locationId: locationId || null,
          }),
        }
      )

      await readJson(response)
      setMsg('Department location updated successfully.')
      await fetchLocations()
      void departments.refetch()
    } catch (error) {
      setErr(
        error instanceof Error
          ? error.message
          : 'Failed to assign department location.'
      )
    }
  }

  async function assignDoctorLocation(
    hospitalDoctorId: string,
    locationId: string
  ) {
    if (!token) {
      setErr('Missing hospital token. Please log in again.')
      return
    }

    try {
      setErr('')
      setMsg('')

      const response = await fetch(
        `${HOSPITAL_API_URL}/hospital/doctors/${hospitalDoctorId}/location`,
        {
          method: 'PATCH',
          headers: authHeaders({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            locationId: locationId || null,
          }),
        }
      )

      await readJson(response)
      setMsg('Doctor location updated successfully.')
      await fetchLocations()
      void doctors.refetch()
    } catch (error) {
      setErr(
        error instanceof Error ? error.message : 'Failed to assign doctor location.'
      )
    }
  }

  return (
    <div>
      <PageHeader
        title="Hospital Locations"
        subtitle="Manage hospital buildings, addresses, map coordinates, departments, and doctor locations."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void fetchLocations()
              void departments.refetch()
              void doctors.refetch()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="space-y-6">
        <GlassCard>
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black dark:text-white">
                {editingId ? 'Edit Building / Location' : 'Add Building / Location'}
              </h2>

              <p className="text-sm text-slate-500">
                Use accurate latitude and longitude so patients can open maps and
                directions.
              </p>
            </div>

            {editingId ? (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Building name">
              <Input
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="Main Building"
              />
            </Field>

            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => updateForm('phone', event.target.value)}
                placeholder="+8801712345678"
              />
            </Field>

            <Field label="Email">
              <Input
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                placeholder="main@careos.com"
              />
            </Field>

            <div className="md:col-span-2 xl:col-span-3">
              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                  placeholder="Main outpatient and general medicine building"
                />
              </Field>
            </div>

            <Field label="Address line 1">
              <Input
                value={form.line1}
                onChange={(event) => updateForm('line1', event.target.value)}
                placeholder="123 Medical Road"
              />
            </Field>

            <Field label="Address line 2 optional">
              <Input
                value={form.line2}
                onChange={(event) => updateForm('line2', event.target.value)}
                placeholder="Floor, block, suite"
              />
            </Field>

            <Field label="City">
              <Input
                value={form.city}
                onChange={(event) => updateForm('city', event.target.value)}
                placeholder="Dhaka"
              />
            </Field>

            <Field label="State / Region">
              <Input
                value={form.state}
                onChange={(event) => updateForm('state', event.target.value)}
                placeholder="Dhaka"
              />
            </Field>

            <Field label="Postal code">
              <Input
                value={form.postalCode}
                onChange={(event) =>
                  updateForm('postalCode', event.target.value)
                }
                placeholder="1205"
              />
            </Field>

            <Field label="Country">
              <Input
                value={form.country}
                onChange={(event) => updateForm('country', event.target.value)}
                placeholder="Bangladesh"
              />
            </Field>

            <Field label="Latitude">
              <Input
                value={form.latitude}
                onChange={(event) => updateForm('latitude', event.target.value)}
                placeholder="23.8103"
              />
            </Field>

            <Field label="Longitude">
              <Input
                value={form.longitude}
                onChange={(event) => updateForm('longitude', event.target.value)}
                placeholder="90.4125"
              />
            </Field>

            <div className="flex flex-col gap-3 rounded-3xl bg-white/50 p-4 dark:bg-white/5">
              <label className="flex items-center gap-3 text-sm font-bold dark:text-white">
                <input
                  type="checkbox"
                  checked={form.isMain}
                  onChange={(event) =>
                    updateForm('isMain', event.target.checked)
                  }
                />
                Main building
              </label>

              <label className="flex items-center gap-3 text-sm font-bold dark:text-white">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm('isActive', event.target.checked)
                  }
                />
                Active / visible
              </label>
            </div>
          </div>

          {err ? (
            <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300">
              {err}
            </p>
          ) : null}

          {msg ? (
            <p className="mt-4 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {msg}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void saveLocation()}
            >
              {isSaving
                ? 'Saving...'
                : editingId
                  ? 'Update Location'
                  : 'Create Location'}
            </Button>

            <Button type="button" variant="secondary" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </GlassCard>

        <section>
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-xl font-black dark:text-white">Buildings</h2>

            <p className="text-sm text-slate-500">
              These are visible to patients through Patient Web discovery and
              appointment details.
            </p>
          </div>

          {isLoading ? (
            <LoadingSkeleton />
          ) : locations.length ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {locations.map((location) => (
                <LocationSummaryCard
                  key={location.id}
                  location={location}
                  onEdit={startEdit}
                  onDelete={(locationId) => void deleteLocation(locationId)}
                  deleting={isDeleting}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No hospital locations found." />
          )}
        </section>

        <GlassCard>
          <div className="mb-5">
            <h2 className="text-xl font-black dark:text-white">
              Assign Departments to Buildings
            </h2>

            <p className="text-sm text-slate-500">
              If a doctor does not have a direct building, the appointment uses
              the department building.
            </p>
          </div>

          {departments.isLoading ? (
            <LoadingSkeleton />
          ) : departments.error ? (
            <ErrorState />
          ) : (departments.data ?? []).length ? (
            <div className="space-y-3">
              {(departments.data ?? []).map((department: any) => (
                <div
                  key={department.id}
                  className="grid gap-3 rounded-3xl border border-white/40 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_320px] md:items-center"
                >
                  <div>
                    <p className="font-black dark:text-white">
                      {department.name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {department.description || 'No description'}
                    </p>
                  </div>

                  <Select
                    value={department.locationId || ''}
                    onChange={(event) =>
                      void assignDepartmentLocation(
                        department.id,
                        event.target.value
                      )
                    }
                  >
                    <option value="">No building assigned</option>

                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No departments found." />
          )}
        </GlassCard>

        <GlassCard>
          <div className="mb-5">
            <h2 className="text-xl font-black dark:text-white">
              Assign Doctors to Buildings
            </h2>

            <p className="text-sm text-slate-500">
              Direct doctor assignment wins. If empty, the system falls back to
              the doctor's department building.
            </p>
          </div>

          {doctors.isLoading ? (
            <LoadingSkeleton />
          ) : doctors.error ? (
            <ErrorState />
          ) : (doctors.data ?? []).length ? (
            <div className="space-y-3">
              {(doctors.data ?? []).map((doctorItem: any) => {
                const fallbackLocation = locations.find(
                  (location) => location.id === doctorItem.department?.locationId
                )

                return (
                  <div
                    key={doctorItem.id}
                    className="grid gap-3 rounded-3xl border border-white/40 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5 md:grid-cols-[1fr_320px] md:items-center"
                  >
                    <div>
                      <p className="font-black dark:text-white">
                        {doctorItem.doctor?.fullName || '—'}
                      </p>

                      <p className="text-sm text-slate-500">
                        {doctorItem.doctor?.specialization || '—'} ·{' '}
                        {doctorItem.department?.name || 'No department'}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Fallback:{' '}
                        {fallbackLocation?.name || 'No department building'}
                      </p>
                    </div>

                    <Select
                      value={doctorItem.locationId || ''}
                      onChange={(event) =>
                        void assignDoctorLocation(
                          doctorItem.id,
                          event.target.value
                        )
                      }
                    >
                      <option value="">Use department building</option>

                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState title="No doctors found." />
          )}
        </GlassCard>
      </div>
    </div>
  )
}