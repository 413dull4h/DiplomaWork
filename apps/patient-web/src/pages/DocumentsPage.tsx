import { FileText, Download, ImageIcon, Stethoscope, ClipboardList } from 'lucide-react'
import { usePatientDocuments } from '../hooks/useDocuments'
import { Badge, Button, Card, Empty, ErrorBox, Loading, Page } from '../components/ui'

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getDocumentIcon(type: string) {
  if (type === 'LAB_REPORT') return <ClipboardList className="h-5 w-5" />
  if (type === 'IMAGING') return <ImageIcon className="h-5 w-5" />
  if (type === 'PRESCRIPTION') return <Stethoscope className="h-5 w-5" />
  return <FileText className="h-5 w-5" />
}

function getFileUrl(fileUrl: string) {
  const baseUrl = import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:4003'
  return `${baseUrl}${fileUrl}`
}

export function DocumentsPage() {
  const documentsQuery = usePatientDocuments()
  const documents = documentsQuery.data ?? []

  return (
    <Page
      title="Medical documents"
      subtitle="View reports, prescriptions, imaging files, and other documents uploaded by your hospital."
    >
      {documentsQuery.isLoading ? (
        <Loading />
      ) : documentsQuery.error ? (
        <ErrorBox text="Could not load medical documents." />
      ) : documents.length === 0 ? (
        <Empty text="No medical documents uploaded yet." />
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <Card key={document.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                    {getDocumentIcon(document.type)}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-950 dark:text-white">
                        {document.title}
                      </h3>
                      <Badge value={document.type} />
                    </div>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {document.description || 'No description provided.'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{document.hospital?.name || 'Hospital'}</span>
                      <span>{document.originalName}</span>
                      <span>{formatFileSize(document.sizeBytes)}</span>
                      <span>{formatDate(document.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={getFileUrl(document.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button variant="secondary">
                    <Download className="h-4 w-4" />
                    Open
                  </Button>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Page>
  )
}