import { useMemo, useState } from 'react'
import { Download, FileText, Trash2, Upload } from 'lucide-react'
import {
  useDeleteHospitalMedicalDocument,
  useHospitalPatientDocuments,
  useUploadHospitalPatientDocument,
} from '../../hooks/useMedicalDocuments'
import type {
  MedicalDocument,
  MedicalDocumentType,
  MedicalDocumentVisibility,
} from '../../api/medicalDocuments'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import {
  EmptyState,
  Err,
  Field,
  GlassCard,
  LoadingSkeleton,
  StatusBadge,
} from '../common/Basic'

const documentTypes: MedicalDocumentType[] = [
  'LAB_REPORT',
  'PRESCRIPTION',
  'IMAGING',
  'DISCHARGE_SUMMARY',
  'REFERRAL',
  'GENERAL_REPORT',
  'OTHER',
]

const visibilityOptions: MedicalDocumentVisibility[] = [
  'PATIENT_VISIBLE',
  'HOSPITAL_ONLY',
]

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getFileUrl(fileUrl: string) {
  if (fileUrl.startsWith('http')) return fileUrl

  const baseUrl =
    import.meta.env.VITE_HOSPITAL_API_URL || 'http://localhost:4002'

  return `${baseUrl}${fileUrl}`
}

function DocumentRow({
  document,
  patientId,
}: {
  document: MedicalDocument
  patientId: string
}) {
  const remove = useDeleteHospitalMedicalDocument(patientId)

  return (
    <div className="rounded-3xl border border-white/50 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[.06]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-300">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="break-words font-black text-slate-950 dark:text-white">
                {document.title}
              </h4>

              <StatusBadge value={document.type} />
              <StatusBadge value={document.visibility} />
            </div>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {document.description || 'No description provided.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{document.originalName}</span>
              <span>{formatFileSize(document.sizeBytes)}</span>
              <span>{formatDate(document.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <a href={getFileUrl(document.fileUrl)} target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              Open
            </Button>
          </a>

          <Button
            variant="danger"
            disabled={remove.isPending}
            onClick={() => {
              if (confirm('Delete this medical document?')) {
                remove.mutate(document.id)
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {remove.error ? (
        <div className="mt-3">
          <Err e={remove.error} />
        </div>
      ) : null}
    </div>
  )
}

export function MedicalDocumentsPanel({
  patientId,
  appointmentId,
  encounterId,
}: {
  patientId?: string | null
  appointmentId?: string | null
  encounterId?: string | null
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<MedicalDocumentType>('LAB_REPORT')
  const [visibility, setVisibility] =
    useState<MedicalDocumentVisibility>('PATIENT_VISIBLE')
  const [file, setFile] = useState<File | null>(null)

  const documentsQuery = useHospitalPatientDocuments(patientId || undefined)
  const upload = useUploadHospitalPatientDocument()

  const documents = documentsQuery.data ?? []

  const appointmentDocuments = useMemo(() => {
    if (!appointmentId) return documents

    return documents.filter((document) => {
      return !document.appointmentId || document.appointmentId === appointmentId
    })
  }, [documents, appointmentId])

  if (!patientId) {
    return null
  }

  const canSubmit = title.trim().length >= 2 && file && !upload.isPending

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!patientId || !file) return

    const form = event.currentTarget

    await upload.mutateAsync({
      patientId,
      title: title.trim(),
      description: description.trim(),
      type,
      visibility,
      appointmentId: appointmentId || undefined,
      encounterId: encounterId || undefined,
      file,
    })

    setTitle('')
    setDescription('')
    setType('LAB_REPORT')
    setVisibility('PATIENT_VISIBLE')
    setFile(null)

    form.reset()
  }

  return (
    <GlassCard>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-950 dark:text-white">
            Medical documents
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload PDF reports, prescriptions, images, and patient-visible files.
          </p>
        </div>
      </div>

      <form className="mb-6 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Blood test report"
            />
          </Field>

          <Field label="Document file">
            <Input
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </Field>

          <Field label="Type">
            <Select
              value={type}
              onChange={(event) =>
                setType(event.target.value as MedicalDocumentType)
              }
            >
              {documentTypes.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Visibility">
            <Select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as MedicalDocumentVisibility)
              }
            >
              {visibilityOptions.map((item) => (
                <option key={item} value={item}>
                  {item === 'PATIENT_VISIBLE'
                    ? 'Patient visible'
                    : 'Hospital only'}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description">
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional notes about this document"
          />
        </Field>

        {upload.error ? <Err e={upload.error} /> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={!canSubmit}>
            <Upload className="h-4 w-4" />
            {upload.isPending ? 'Uploading...' : 'Upload document'}
          </Button>

          <p className="text-xs text-slate-500">
            Allowed: PDF, JPG, PNG, WEBP.
          </p>
        </div>
      </form>

      {documentsQuery.isLoading ? (
        <LoadingSkeleton />
      ) : appointmentDocuments.length ? (
        <div className="space-y-3">
          {appointmentDocuments.map((document) => (
            <DocumentRow
              key={document.id}
              document={document}
              patientId={patientId}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No medical documents uploaded for this patient yet." />
      )}
    </GlassCard>
  )
}
