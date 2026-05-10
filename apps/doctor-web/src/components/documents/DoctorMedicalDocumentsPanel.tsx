import { useMemo, useState } from 'react'
import {
    buildDoctorDocumentUrl,
    type MedicalDocumentType,
    type MedicalDocumentVisibility,
} from '../../api/medicalDocuments'
import {
    useDeleteDoctorDocument,
    useDoctorAppointmentDocuments,
    useUploadDoctorAppointmentDocument,
} from '../../hooks/useMedicalDocuments'

type Props = {
    appointmentId: string
    appointmentStatus?: string
}

const documentTypes: Array<{ label: string; value: MedicalDocumentType }> = [
    { label: 'Prescription', value: 'PRESCRIPTION' },
    { label: 'Lab report', value: 'LAB_REPORT' },
    { label: 'Imaging', value: 'IMAGING' },
    { label: 'Discharge summary', value: 'DISCHARGE_SUMMARY' },
    { label: 'Referral', value: 'REFERRAL' },
    { label: 'General report', value: 'GENERAL_REPORT' },
    { label: 'Other', value: 'OTHER' },
]

const visibilityOptions: Array<{
    label: string
    value: MedicalDocumentVisibility
}> = [
        { label: 'Patient visible', value: 'PATIENT_VISIBLE' },
        { label: 'Hospital only', value: 'HOSPITAL_ONLY' },
    ]

function formatBytes(bytes: number) {
    if (!bytes) return '0 KB'

    const kb = bytes / 1024

    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`
    }

    return `${(kb / 1024).toFixed(1)} MB`
}

function getErrorMessage(error: unknown) {
    if (!error) return ''

    if (error instanceof Error) {
        return error.message
    }

    return 'Upload failed.'
}

export function DoctorMedicalDocumentsPanel({
    appointmentId,
    appointmentStatus,
}: Props) {
    const documentsQuery = useDoctorAppointmentDocuments(appointmentId)
    const uploadMutation = useUploadDoctorAppointmentDocument()
    const deleteMutation = useDeleteDoctorDocument(appointmentId)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<MedicalDocumentType>('PRESCRIPTION')
    const [visibility, setVisibility] =
        useState<MedicalDocumentVisibility>('PATIENT_VISIBLE')
    const [file, setFile] = useState<File | null>(null)

    const canUpload = useMemo(() => {
        if (!appointmentStatus) return true

        return ['CONFIRMED', 'COMPLETED'].includes(appointmentStatus)
    }, [appointmentStatus])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!title.trim()) return
        if (!file) return

        await uploadMutation.mutateAsync({
            appointmentId,
            title: title.trim(),
            description: description.trim() || undefined,
            type,
            visibility,
            file,
        })

        setTitle('')
        setDescription('')
        setType('PRESCRIPTION')
        setVisibility('PATIENT_VISIBLE')
        setFile(null)

        const input = document.getElementById(
            'doctor-document-file'
        ) as HTMLInputElement | null

        if (input) {
            input.value = ''
        }
    }

    return (
        <section className="rounded-3xl border border-white/40 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-black text-slate-950 dark:text-white">
                        Medical documents
                    </h2>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Upload prescriptions, lab requests, referrals, reports, or follow-up
                        files for this appointment.
                    </p>
                </div>

                {appointmentStatus ? (
                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {appointmentStatus}
                    </span>
                ) : null}
            </div>

            {!canUpload ? (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                    Documents can only be uploaded for CONFIRMED or COMPLETED
                    appointments.
                </div>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-200">
                            Title
                        </span>

                        <input
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Doctor prescription"
                            disabled={!canUpload || uploadMutation.isPending}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-200">
                            Type
                        </span>

                        <select
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            value={type}
                            onChange={(event) =>
                                setType(event.target.value as MedicalDocumentType)
                            }
                            disabled={!canUpload || uploadMutation.isPending}
                        >
                            {documentTypes.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-200">
                            Visibility
                        </span>

                        <select
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            value={visibility}
                            onChange={(event) =>
                                setVisibility(event.target.value as MedicalDocumentVisibility)
                            }
                            disabled={!canUpload || uploadMutation.isPending}
                        >
                            {visibilityOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-200">
                            File
                        </span>

                        <input
                            id="doctor-document-file"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(event) => setFile(event.target.files?.[0] || null)}
                            disabled={!canUpload || uploadMutation.isPending}
                        />

                        {file ? (
                            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Selected: {file.name}
                            </p>
                        ) : null}
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1 block text-sm font-bold text-slate-700 dark:text-slate-200">
                        Description
                    </span>

                    <textarea
                        className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Uploaded by doctor after consultation"
                        disabled={!canUpload || uploadMutation.isPending}
                    />
                </label>

                {uploadMutation.error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                        {getErrorMessage(uploadMutation.error)}
                    </div>
                ) : null}

                <button
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                    type="submit"
                    disabled={
                        !canUpload || uploadMutation.isPending || !title.trim() || !file
                    }
                >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload document'}
                </button>
            </form>

            <div className="mt-6">
                <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">
                    Uploaded documents
                </h3>

                {documentsQuery.isLoading ? (
                    <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        Loading documents...
                    </div>
                ) : documentsQuery.error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                        Could not load documents.
                    </div>
                ) : documentsQuery.data?.length ? (
                    <div className="space-y-3">
                        {documentsQuery.data.map((document) => (
                            <article
                                key={document.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950"
                            >
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200">
                                                {document.type}
                                            </span>

                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {document.visibility}
                                            </span>
                                        </div>

                                        <h4 className="mt-2 font-black text-slate-950 dark:text-white">
                                            {document.title}
                                        </h4>

                                        {document.description ? (
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {document.description}
                                            </p>
                                        ) : null}

                                        <p className="mt-2 text-xs text-slate-500">
                                            {document.originalName} · {formatBytes(document.sizeBytes)}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <a
                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                            href={buildDoctorDocumentUrl(document.fileUrl)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Open
                                        </a>

                                        <button
                                            className="rounded-xl border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/30"
                                            type="button"
                                            disabled={deleteMutation.isPending}
                                            onClick={() => {
                                                void deleteMutation.mutateAsync(document.id)
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        No documents uploaded for this appointment yet.
                    </div>
                )}
            </div>
        </section>
    )
}