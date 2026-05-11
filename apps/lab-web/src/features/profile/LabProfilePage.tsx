import {
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { GlassCard } from '../../components/common/GlassCard'
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton'
import { ErrorState } from '../../components/common/ErrorState'
import { StatusBadge } from '../../components/common/StatusBadge'
import { Button } from '../../components/ui/Button'
import { useLabProfile } from './useLabProfile'
import type { Address } from '../../types/models'

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 font-black text-slate-950 dark:text-white">
        {value || '—'}
      </dd>
    </div>
  )
}

function addressText(address?: Partial<Address> | null) {
  if (!address) return 'No address added'

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

function mapsUrl(address?: Partial<Address> | null) {
  if (!address) return '#'

  if (address.latitude && address.longitude) {
    return `https://www.google.com/maps?q=${address.latitude},${address.longitude}`
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    addressText(address)
  )}`
}

function directionsUrl(address?: Partial<Address> | null) {
  if (!address) return '#'

  const destination =
    address.latitude && address.longitude
      ? `${address.latitude},${address.longitude}`
      : addressText(address)

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination
  )}`
}

function MapPreview({ address }: { address?: Partial<Address> | null }) {
  if (!address) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/10">
        No lab location has been added yet. Hospital admin can add it from the
        Hospital Web lab management page.
      </div>
    )
  }

  const query =
    address.latitude && address.longitude
      ? `${address.latitude},${address.longitude}`
      : addressText(address)

  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    query
  )}&z=15&output=embed`

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 dark:border-white/10 dark:bg-white/5">
      <iframe
        title="Lab location map"
        src={src}
        className="h-72 w-full border-0"
        loading="lazy"
      />

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-slate-950 dark:text-white">
            {addressText(address)}
          </p>

          {address.latitude && address.longitude ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {address.latitude}, {address.longitude}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <a href={mapsUrl(address)} target="_blank" rel="noreferrer">
            <Button variant="secondary" type="button">
              <ExternalLink className="h-4 w-4" />
              Open Map
            </Button>
          </a>

          <a href={directionsUrl(address)} target="_blank" rel="noreferrer">
            <Button variant="secondary" type="button">
              <Navigation className="h-4 w-4" />
              Directions
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}

export function LabProfilePage() {
  const profile = useLabProfile()

  if (profile.isLoading) return <LoadingSkeleton />
  if (profile.error || !profile.data) {
    return <ErrorState onRetry={() => void profile.refetch()} />
  }

  const lab = profile.data

  return (
    <div>
      <PageHeader
        title="Lab Profile"
        subtitle="Read-only diagnostic center profile from the real Lab API."
      />

      <div className="space-y-5">
        <GlassCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-3xl bg-cyan-600 p-4 text-white shadow-lg shadow-cyan-600/20">
                <Building2 className="h-8 w-8" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                    {lab.name}
                  </h2>
                  <StatusBadge value={lab.status} />
                  <StatusBadge value={lab.type} />
                  <StatusBadge value={lab.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  {lab.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <dl className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <Info label="Legal name" value={lab.legalName} />
            <Info label="License number" value={lab.licenseNumber} />
            <Info label="Accreditation" value={lab.accreditation} />
            <Info label="Working hours" value={lab.workingHours} />
            <Info label="Hospital link" value={lab.hospital?.name} />
            <Info label="Address" value={addressText(lab.address)} />
          </dl>
        </GlassCard>

        <GlassCard>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cyan-600" />
            <h3 className="font-black text-slate-950 dark:text-white">
              Lab Location
            </h3>
          </div>

          <MapPreview address={lab.address} />
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard>
            <Mail className="h-5 w-5 text-cyan-600" />
            <Info label="Email" value={lab.contactEmail} />
          </GlassCard>

          <GlassCard>
            <Phone className="h-5 w-5 text-cyan-600" />
            <Info label="Phone" value={lab.contactPhone} />
          </GlassCard>

          <GlassCard>
            <ShieldCheck className="h-5 w-5 text-cyan-600" />
            <Info label="Active" value={lab.isActive ? 'Yes' : 'No'} />
          </GlassCard>
        </div>

        <GlassCard>
          <h3 className="font-black text-slate-950 dark:text-white">
            Backend note
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Current Lab API supports GET /lab/profile only. Profile editing is
            intentionally read-only here because PATCH /lab/profile is not
            implemented yet. Hospital admin manages lab profile and location
            from Hospital Web.
          </p>
        </GlassCard>
      </div>
    </div>
  )
}