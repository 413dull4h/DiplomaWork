import { type ReactNode, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  FileText,
  FlaskConical,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  UserPlus,
} from 'lucide-react'

import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import {
  EmptyState,
  ErrorState,
  GlassCard,
  LoadingSkeleton,
  PageHeader,
  StatusBadge,
} from '../../components/common/Basic'
import {
  useCreateHospitalLab,
  useCreateHospitalLabAdmin,
  useDeleteHospitalLabDocument,
  useHospitalLab,
  useHospitalLabDocuments,
  useHospitalLabs,
  useUpdateHospitalLab,
  useUploadHospitalLabDocument,
} from '../../hooks/useHospitalLabs'
import type {
  Address,
  CreateLabPayload,
  LabDocument,
  LabDocumentType,
  UpdateLabPayload,
} from '../../api/labs'

const API_URL = import.meta.env.VITE_HOSPITAL_API_URL || 'http://localhost:4002'

function fileUrl(url?: string | null) {
  if (!url) return '#'
  if (url.startsWith('http')) return url
  return `${API_URL}${url}`
}

function dateLabel(value?: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function countLabel(count?: number) {
  return String(count ?? 0)
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

function numberOrUndefined(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return undefined

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : undefined
}

function buildAddressPayload(values: LabFormValues) {
  const hasAddress =
    values.addressLine1 ||
    values.addressLine2 ||
    values.addressCity ||
    values.addressState ||
    values.addressPostalCode ||
    values.addressCountry ||
    values.addressLatitude ||
    values.addressLongitude

  if (!hasAddress) return undefined

  if (!values.addressLine1 || !values.addressCity || !values.addressCountry) {
    return null
  }

  return {
    line1: values.addressLine1,
    line2: values.addressLine2 || undefined,
    city: values.addressCity,
    state: values.addressState || undefined,
    postalCode: values.addressPostalCode || undefined,
    country: values.addressCountry,
    latitude: numberOrUndefined(values.addressLatitude),
    longitude: numberOrUndefined(values.addressLongitude),
  }
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-bold text-slate-900 dark:text-white">
        {value || '—'}
      </dd>
    </div>
  )
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon?: ReactNode
}) {
  return (
    <GlassCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        {icon ? <div className="text-cyan-600">{icon}</div> : null}
      </div>
    </GlassCard>
  )
}

function MapPreview({ address }: { address?: Partial<Address> | null }) {
  if (!address) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-white/10">
        No lab location added yet.
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
        title="Lab map preview"
        src={src}
        className="h-64 w-full border-0"
        loading="lazy"
      />

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-slate-900 dark:text-white">
            {addressText(address)}
          </p>

          {address.latitude && address.longitude ? (
            <p className="text-sm text-slate-500">
              {address.latitude}, {address.longitude}
            </p>
          ) : null}
        </div>

        <a href={mapsUrl(address)} target="_blank" rel="noreferrer">
          <Button variant="secondary" type="button">
            <ExternalLink className="h-4 w-4" />
            Open Map
          </Button>
        </a>
      </div>
    </div>
  )
}

const labSchema = z.object({
  name: z.string().min(2, 'Lab name is required'),
  legalName: z.string().optional(),
  contactEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  licenseNumber: z.string().optional(),
  accreditation: z.string().optional(),
  workingHours: z.string().optional(),
  description: z.string().optional(),

  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressPostalCode: z.string().optional(),
  addressCountry: z.string().optional(),
  addressLatitude: z.string().optional(),
  addressLongitude: z.string().optional(),
})

const adminSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
})

const documentSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  type: z.enum([
    'LICENSE',
    'ACCREDITATION',
    'TAX_DOCUMENT',
    'OWNERSHIP_DOCUMENT',
    'COMPLIANCE_CERTIFICATE',
    'OTHER',
  ]),
  document: z
    .any()
    .refine((files) => files?.length === 1, 'Please choose a file'),
})

type LabFormValues = z.infer<typeof labSchema>
type AdminFormValues = z.infer<typeof adminSchema>
type DocumentFormValues = z.infer<typeof documentSchema>

export function HospitalLabsPage() {
  const [search, setSearch] = useState('')
  const labsQuery = useHospitalLabs()

  const labs = labsQuery.data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return labs

    return labs.filter((lab) =>
      [
        lab.name,
        lab.legalName,
        lab.contactEmail,
        lab.contactPhone,
        lab.licenseNumber,
        lab.status,
        lab.type,
        addressText(lab.address),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [labs, search])

  if (labsQuery.isLoading) return <LoadingSkeleton />
  if (labsQuery.error) return <ErrorState />

  return (
    <div>
      <PageHeader
        title="Labs"
        subtitle="Manage internal hospital labs, lab admins, verification documents, and lab locations."
        actions={
          <Link to="/labs/new">
            <Button>
              <Plus className="h-4 w-4" />
              Create Lab
            </Button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Total labs"
          value={labs.length}
          icon={<FlaskConical className="h-6 w-6" />}
        />
        <MiniStat
          label="Active labs"
          value={labs.filter((lab) => lab.isActive).length}
          icon={<ShieldCheck className="h-6 w-6" />}
        />
        <MiniStat
          label="Tests"
          value={labs.reduce((sum, lab) => sum + (lab.tests?.length ?? 0), 0)}
          icon={<FileText className="h-6 w-6" />}
        />
        <MiniStat
          label="Reports"
          value={labs.reduce((sum, lab) => sum + (lab.reports?.length ?? 0), 0)}
          icon={<Building2 className="h-6 w-6" />}
        />
      </div>

      <GlassCard className="mb-5">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search labs by name, email, phone, license, status, address..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </GlassCard>

      {filtered.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((lab) => (
            <GlassCard key={lab.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge value={lab.status} />
                    <StatusBadge value={lab.type} />
                    <StatusBadge value={lab.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </div>

                  <h3 className="mt-3 text-xl font-black text-slate-900 dark:text-white">
                    {lab.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {lab.legalName || 'No legal name'} ·{' '}
                    {lab.contactEmail || 'No email'}
                  </p>

                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                    <span>{addressText(lab.address)}</span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-slate-500">Tests</p>
                      <p className="font-bold dark:text-white">
                        {countLabel(lab.tests?.length)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Orders</p>
                      <p className="font-bold dark:text-white">
                        {countLabel(lab.orders?.length)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Reports</p>
                      <p className="font-bold dark:text-white">
                        {countLabel(lab.reports?.length)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Docs</p>
                      <p className="font-bold dark:text-white">
                        {countLabel(lab.documents?.length)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {lab.address ? (
                    <a href={mapsUrl(lab.address)} target="_blank" rel="noreferrer">
                      <Button variant="secondary" type="button">
                        Map
                      </Button>
                    </a>
                  ) : null}

                  <Link to={`/labs/${lab.id}`}>
                    <Button variant="secondary">View</Button>
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No labs found"
          description="Create an internal lab or adjust your search."
        />
      )}
    </div>
  )
}

export function HospitalLabCreatePage() {
  const navigate = useNavigate()
  const createLab = useCreateHospitalLab()
  const [message, setMessage] = useState('')

  const form = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: {
      name: '',
      legalName: '',
      contactEmail: '',
      contactPhone: '',
      licenseNumber: '',
      accreditation: '',
      workingHours: '',
      description: '',
      addressLine1: '',
      addressLine2: '',
      addressCity: '',
      addressState: '',
      addressPostalCode: '',
      addressCountry: '',
      addressLatitude: '',
      addressLongitude: '',
    },
  })

  async function onSubmit(values: LabFormValues) {
    setMessage('')

    const address = buildAddressPayload(values)

    if (address === null) {
      setMessage('Address requires line 1, city, and country.')
      return
    }

    const payload: CreateLabPayload = {
      name: values.name,
      legalName: values.legalName || undefined,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
      licenseNumber: values.licenseNumber || undefined,
      accreditation: values.accreditation || undefined,
      workingHours: values.workingHours || undefined,
      description: values.description || undefined,
      address,
    }

    const result = await createLab.mutateAsync(payload)
    navigate(`/labs/${result.lab.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Create Lab"
        subtitle="Create an internal hospital diagnostic lab with optional map location."
        actions={
          <Link to="/labs">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <GlassCard className="max-w-4xl">
        {message ? (
          <p className="mb-4 rounded-2xl bg-amber-500/10 p-3 text-sm font-semibold text-amber-700">
            {message}
          </p>
        ) : null}

        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <section>
            <h3 className="mb-3 font-black text-slate-900 dark:text-white">
              Lab Details
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Lab name
                </span>
                <Input {...form.register('name')} placeholder="CareOS Advanced Lab" />
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.name?.message}
                </p>
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Legal name
                </span>
                <Input
                  {...form.register('legalName')}
                  placeholder="CareOS Advanced Lab Ltd"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Contact email
                </span>
                <Input
                  {...form.register('contactEmail')}
                  placeholder="advanced.lab@careos.com"
                />
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.contactEmail?.message}
                </p>
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Contact phone
                </span>
                <Input
                  {...form.register('contactPhone')}
                  placeholder="+8801733333333"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  License number
                </span>
                <Input {...form.register('licenseNumber')} placeholder="LAB-002" />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Accreditation
                </span>
                <Input
                  {...form.register('accreditation')}
                  placeholder="Demo Accreditation"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Working hours
                </span>
                <Input
                  {...form.register('workingHours')}
                  placeholder="08:00 - 20:00"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Description
                </span>
                <Textarea
                  {...form.register('description')}
                  placeholder="Internal advanced diagnostic lab."
                />
              </label>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-600" />
              <h3 className="font-black text-slate-900 dark:text-white">
                Lab Location
              </h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Address line 1
                </span>
                <Input
                  {...form.register('addressLine1')}
                  placeholder="456 Diagnostic Road"
                />
              </label>

              <label className="md:col-span-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Address line 2
                </span>
                <Input {...form.register('addressLine2')} placeholder="Floor 2" />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  City
                </span>
                <Input {...form.register('addressCity')} placeholder="Dhaka" />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  State
                </span>
                <Input {...form.register('addressState')} placeholder="Dhaka" />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Postal code
                </span>
                <Input {...form.register('addressPostalCode')} placeholder="1205" />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Country
                </span>
                <Input {...form.register('addressCountry')} placeholder="Bangladesh" />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Latitude
                </span>
                <Input {...form.register('addressLatitude')} placeholder="23.7806" />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Longitude
                </span>
                <Input {...form.register('addressLongitude')} placeholder="90.4074" />
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <Button disabled={createLab.isPending}>
              {createLab.isPending ? 'Creating...' : 'Create Lab'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}

function LabAdminPanel({ labId }: { labId: string }) {
  const createAdmin = useCreateHospitalLabAdmin(labId)
  const [message, setMessage] = useState('')

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
      password: 'Lab@12345',
      phone: '',
    },
  })

  async function onSubmit(values: AdminFormValues) {
    setMessage('')
    const result = await createAdmin.mutateAsync(values)
    setMessage(`Lab admin created: ${result.labAdmin.email}`)
    form.reset({
      email: '',
      password: 'Lab@12345',
      phone: '',
    })
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-cyan-600" />
        <h3 className="font-black text-slate-900 dark:text-white">
          Create Lab Admin Login
        </h3>
      </div>

      {message ? (
        <p className="mb-4 rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      ) : null}

      <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <label>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Email
          </span>
          <Input {...form.register('email')} placeholder="lab.admin@careos.com" />
          <p className="mt-1 text-xs text-red-500">
            {form.formState.errors.email?.message}
          </p>
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Password
          </span>
          <Input
            type="text"
            {...form.register('password')}
            placeholder="Lab@12345"
          />
          <p className="mt-1 text-xs text-red-500">
            {form.formState.errors.password?.message}
          </p>
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Phone
          </span>
          <Input {...form.register('phone')} placeholder="+8801733333333" />
        </label>

        <Button disabled={createAdmin.isPending}>
          {createAdmin.isPending ? 'Creating...' : 'Create Admin'}
        </Button>
      </form>
    </GlassCard>
  )
}

function LabDocumentsPanel({ labId }: { labId: string }) {
  const documentsQuery = useHospitalLabDocuments(labId)
  const uploadDocument = useUploadHospitalLabDocument(labId)
  const deleteDocument = useDeleteHospitalLabDocument(labId)
  const [message, setMessage] = useState('')

  const documents = documentsQuery.data ?? []

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'LICENSE',
    },
  })

  async function onSubmit(values: DocumentFormValues) {
    setMessage('')

    await uploadDocument.mutateAsync({
      title: values.title,
      description: values.description,
      type: values.type as LabDocumentType,
      document: values.document[0],
    })

    setMessage('Document uploaded successfully.')
    form.reset({
      title: '',
      description: '',
      type: 'LICENSE',
      document: undefined,
    })
  }

  async function removeDocument(document: LabDocument) {
    const ok = window.confirm(`Delete document "${document.title}"?`)
    if (!ok) return

    await deleteDocument.mutateAsync(document.id)
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <Upload className="h-5 w-5 text-cyan-600" />
        <h3 className="font-black text-slate-900 dark:text-white">
          Lab Verification Documents
        </h3>
      </div>

      {message ? (
        <p className="mb-4 rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      ) : null}

      <form className="mb-6 space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Title
            </span>
            <Input {...form.register('title')} placeholder="Lab License" />
            <p className="mt-1 text-xs text-red-500">
              {form.formState.errors.title?.message}
            </p>
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Type
            </span>
            <Select {...form.register('type')}>
              <option value="LICENSE">License</option>
              <option value="ACCREDITATION">Accreditation</option>
              <option value="TAX_DOCUMENT">Tax document</option>
              <option value="OWNERSHIP_DOCUMENT">Ownership document</option>
              <option value="COMPLIANCE_CERTIFICATE">
                Compliance certificate
              </option>
              <option value="OTHER">Other</option>
            </Select>
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Description
            </span>
            <Textarea
              {...form.register('description')}
              placeholder="Official lab license document"
            />
          </label>

          <label className="md:col-span-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              File
            </span>
            <Input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              {...form.register('document')}
            />
            <p className="mt-1 text-xs text-slate-500">
              Allowed: PDF, JPG, PNG, WEBP. Max depends on backend upload limit.
            </p>
            <p className="mt-1 text-xs text-red-500">
              {String(form.formState.errors.document?.message ?? '')}
            </p>
          </label>
        </div>

        <Button disabled={uploadDocument.isPending}>
          {uploadDocument.isPending ? 'Uploading...' : 'Upload Document'}
        </Button>
      </form>

      {documentsQuery.isLoading ? (
        <LoadingSkeleton />
      ) : documents.length ? (
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={document.type} />
                  <StatusBadge value={document.mimeType} />
                </div>
                <h4 className="mt-2 font-black text-slate-900 dark:text-white">
                  {document.title}
                </h4>
                <p className="text-sm text-slate-500">
                  {document.originalName} · {dateLabel(document.createdAt)}
                </p>
                {document.description ? (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {document.description}
                  </p>
                ) : null}
              </div>

              <div className="flex gap-2">
                <a href={fileUrl(document.fileUrl)} target="_blank" rel="noreferrer">
                  <Button variant="secondary" type="button">
                    Open
                  </Button>
                </a>
                <Button
                  variant="danger"
                  type="button"
                  disabled={deleteDocument.isPending}
                  onClick={() => void removeDocument(document)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No documents uploaded"
          description="Upload license, accreditation, or compliance documents."
        />
      )}
    </GlassCard>
  )
}

function LabEditPanel({
  labId,
  initialValues,
}: {
  labId: string
  initialValues: LabFormValues & { isActive?: boolean }
}) {
  const updateLab = useUpdateHospitalLab(labId)
  const [message, setMessage] = useState('')

  const form = useForm<LabFormValues & { isActive?: boolean }>({
    resolver: zodResolver(
      labSchema.extend({
        isActive: z.boolean().optional(),
      })
    ),
    values: initialValues,
  })

  async function onSubmit(values: LabFormValues & { isActive?: boolean }) {
    setMessage('')

    const address = buildAddressPayload(values)

    if (address === null) {
      setMessage('Address requires line 1, city, and country.')
      return
    }

    const payload: UpdateLabPayload = {
      name: values.name,
      legalName: values.legalName || undefined,
      contactEmail: values.contactEmail || undefined,
      contactPhone: values.contactPhone || undefined,
      licenseNumber: values.licenseNumber || undefined,
      accreditation: values.accreditation || undefined,
      workingHours: values.workingHours || undefined,
      description: values.description || undefined,
      isActive: values.isActive,
      address,
    }

    await updateLab.mutateAsync(payload)
    setMessage('Lab updated successfully.')
  }

  return (
    <GlassCard>
      <h3 className="mb-4 font-black text-slate-900 dark:text-white">
        Edit Lab Profile & Location
      </h3>

      {message ? (
        <p className="mb-4 rounded-2xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      ) : null}

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <section>
          <h4 className="mb-3 font-bold text-slate-900 dark:text-white">
            Basic Information
          </h4>

          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Lab name
              </span>
              <Input {...form.register('name')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Legal name
              </span>
              <Input {...form.register('legalName')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Contact email
              </span>
              <Input {...form.register('contactEmail')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Contact phone
              </span>
              <Input {...form.register('contactPhone')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                License number
              </span>
              <Input {...form.register('licenseNumber')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Accreditation
              </span>
              <Input {...form.register('accreditation')} />
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Working hours
              </span>
              <Input {...form.register('workingHours')} />
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Description
              </span>
              <Textarea {...form.register('description')} />
            </label>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cyan-600" />
            <h4 className="font-bold text-slate-900 dark:text-white">
              Location
            </h4>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Address line 1
              </span>
              <Input {...form.register('addressLine1')} />
            </label>

            <label className="md:col-span-2">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Address line 2
              </span>
              <Input {...form.register('addressLine2')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                City
              </span>
              <Input {...form.register('addressCity')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                State
              </span>
              <Input {...form.register('addressState')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Postal code
              </span>
              <Input {...form.register('addressPostalCode')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Country
              </span>
              <Input {...form.register('addressCountry')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Latitude
              </span>
              <Input {...form.register('addressLatitude')} />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Longitude
              </span>
              <Input {...form.register('addressLongitude')} />
            </label>
          </div>
        </section>

        <Button disabled={updateLab.isPending}>
          {updateLab.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </GlassCard>
  )
}

export function HospitalLabDetailsPage() {
  const { id = '' } = useParams()
  const labQuery = useHospitalLab(id)

  if (labQuery.isLoading) return <LoadingSkeleton />
  if (labQuery.error || !labQuery.data) return <ErrorState />

  const lab = labQuery.data

  return (
    <div>
      <PageHeader
        title={lab.name}
        subtitle="Manage lab profile, location, admins, documents, tests, orders, and reports."
        actions={
          <Link to="/labs">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MiniStat label="Tests" value={lab.tests?.length ?? 0} />
        <MiniStat label="Orders" value={lab.orders?.length ?? 0} />
        <MiniStat label="Reports" value={lab.reports?.length ?? 0} />
        <MiniStat label="Documents" value={lab.documents?.length ?? 0} />
        <MiniStat label="Staff" value={lab.staff?.length ?? 0} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <GlassCard>
            <div className="mb-4 flex flex-wrap gap-2">
              <StatusBadge value={lab.status} />
              <StatusBadge value={lab.type} />
              <StatusBadge value={lab.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </div>

            <dl className="grid gap-4 md:grid-cols-2">
              <Info label="Legal name" value={lab.legalName} />
              <Info label="Contact email" value={lab.contactEmail} />
              <Info label="Contact phone" value={lab.contactPhone} />
              <Info label="License number" value={lab.licenseNumber} />
              <Info label="Accreditation" value={lab.accreditation} />
              <Info label="Working hours" value={lab.workingHours} />
              <Info label="Created" value={dateLabel(lab.createdAt)} />
              <Info label="Updated" value={dateLabel(lab.updatedAt)} />
            </dl>

            {lab.description ? (
              <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-300">
                {lab.description}
              </p>
            ) : null}
          </GlassCard>

          <GlassCard>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-600" />
              <h3 className="font-black text-slate-900 dark:text-white">
                Lab Location
              </h3>
            </div>

            <MapPreview address={lab.address} />
          </GlassCard>

          <LabEditPanel
            labId={lab.id}
            initialValues={{
              name: lab.name,
              legalName: lab.legalName ?? '',
              contactEmail: lab.contactEmail ?? '',
              contactPhone: lab.contactPhone ?? '',
              licenseNumber: lab.licenseNumber ?? '',
              accreditation: lab.accreditation ?? '',
              workingHours: lab.workingHours ?? '',
              description: lab.description ?? '',
              isActive: lab.isActive,
              addressLine1: lab.address?.line1 ?? '',
              addressLine2: lab.address?.line2 ?? '',
              addressCity: lab.address?.city ?? '',
              addressState: lab.address?.state ?? '',
              addressPostalCode: lab.address?.postalCode ?? '',
              addressCountry: lab.address?.country ?? '',
              addressLatitude:
                lab.address?.latitude === null || lab.address?.latitude === undefined
                  ? ''
                  : String(lab.address.latitude),
              addressLongitude:
                lab.address?.longitude === null ||
                  lab.address?.longitude === undefined
                  ? ''
                  : String(lab.address.longitude),
            }}
          />

          <LabDocumentsPanel labId={lab.id} />
        </div>

        <div className="space-y-5">
          <LabAdminPanel labId={lab.id} />

          <GlassCard>
            <h3 className="mb-3 font-black text-slate-900 dark:text-white">
              Staff
            </h3>

            {lab.staff?.length ? (
              <div className="space-y-3">
                {lab.staff.map((staff) => (
                  <div
                    key={staff.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="font-bold dark:text-white">
                      {staff.user?.email || '—'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {staff.staffRole} · {staff.user?.status || '—'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No staff"
                description="Create a lab admin account for this lab."
              />
            )}
          </GlassCard>

          <GlassCard>
            <h3 className="mb-3 font-black text-slate-900 dark:text-white">
              Recent Reports
            </h3>

            {lab.reports?.length ? (
              <div className="space-y-3">
                {lab.reports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <p className="font-bold dark:text-white">{report.title}</p>
                    <p className="text-sm text-slate-500">
                      {report.status} · {dateLabel(report.createdAt)}
                    </p>
                    {report.fileUrl ? (
                      <a
                        className="mt-2 inline-block text-sm font-bold text-cyan-700"
                        href={fileUrl(report.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open report
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No reports" description="No lab reports yet." />
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}