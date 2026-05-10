import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Trash2, Upload } from 'lucide-react'
import { ReviewPanel } from '../components/reviews/ReviewPanel'
import { useCreateAppointmentChatThread } from '../hooks/useChats'
import { usePatientAuthStore } from '../store/authStore'
import { parseApiError } from '../api/client'
import {
    AppointmentCard,
    Avatar,
    Badge,
    Button,
    Card,
    Confirm,
    DoctorCard,
    Empty,
    ErrorBox,
    Field,
    HospitalCard,
    Input,
    Loading,
    Page,
    PublicNav,
    RecordCard,
    Select,
    Slots,
    Textarea,
} from '../components/ui'
import {
    useCancelAppointment,
    useCreateAppointment,
    useDoctorSlots,
    useHealth,
    useHospitalDoctors,
    useHospitals,
    usePatientAppointment,
    usePatientAppointments,
    usePatientLogin,
    usePatientProfile,
    usePatientRecords,
    usePatientRecord,
    usePatientRegister,
    usePatientSession,
    useUpdatePatientProfile,
} from '../hooks'
import type { AppointmentType, DoctorSlot } from '../types/models'
import { addr, dt, n, today } from '../utils/format'

const PATIENT_API_URL =
    import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:4003'

function getPatientImageUrl(path?: string | null) {
    if (!path) {
        return null
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path
    }

    return `${PATIENT_API_URL}${path}`
}

function openExternalUrl(url?: string | null) {
    if (!url) {
        return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
}

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

const regSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    phone: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z.string().optional(),
})

export function Landing() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen">
            <PublicNav />

            <main className="mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-2">
                <section>
                    <p className="mb-4 inline-flex rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700">
                        careOS Patient
                    </p>

                    <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-6xl">
                        {t('landing.headline')}
                    </h1>

                    <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
                        {t('landing.subheadline')}
                    </p>

                    <div className="mt-8 flex gap-3">
                        <Link to="/register">
                            <Button>{t('landing.primary')}</Button>
                        </Link>

                        <Link to="/features">
                            <Button variant="secondary">{t('landing.secondary')}</Button>
                        </Link>
                    </div>
                </section>

                <Card className="grid gap-4 sm:grid-cols-2">
                    {[
                        'nav.hospitals',
                        'nav.appointments',
                        'nav.records',
                        'nav.medicalBasics',
                    ].map((key) => (
                        <div
                            key={key}
                            className="rounded-3xl bg-white/60 p-5 dark:bg-white/10"
                        >
                            <b>{t(key)}</b>
                            <p className="mt-2 text-sm text-slate-500">{t('future')}</p>
                        </div>
                    ))}
                </Card>
            </main>
        </div>
    )
}

export function Features() {
    const { t } = useTranslation()

    return (
        <div>
            <PublicNav />

            <main className="mx-auto max-w-7xl px-4 py-12">
                <h1 className="text-4xl font-black dark:text-white">
                    {t('landing.features')}
                </h1>

                <div className="mt-8 grid gap-5 md:grid-cols-3">
                    {[
                        'nav.hospitals',
                        'slots.title',
                        'appointments.title',
                        'records.title',
                        'teleconsult.title',
                        'medical.title',
                    ].map((key) => (
                        <Card key={key}>
                            <b>{t(key)}</b>
                            <p className="mt-2 text-sm text-slate-500">
                                {t('landing.subheadline')}
                            </p>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    )
}

export function Trust() {
    const { t } = useTranslation()

    return (
        <div>
            <PublicNav />

            <main className="mx-auto max-w-4xl px-4 py-12">
                <Card>
                    <h1 className="text-4xl font-black dark:text-white">
                        {t('landing.trust')}
                    </h1>

                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                        careOS keeps patient workflows simple, protected, and ready for
                        secure clinical expansion.
                    </p>
                </Card>
            </main>
        </div>
    )
}

export function Login() {
    const { t } = useTranslation()
    const nav = useNavigate()
    const [err, setErr] = useState('')
    const mut = usePatientLogin()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(loginSchema),
    })

    async function sub(values: any) {
        setErr('')

        try {
            const data = await mut.mutateAsync(values)

            if (data.user.primaryRole !== 'PATIENT') {
                nav('/unauthorized')
            } else {
                nav('/app/dashboard')
            }
        } catch (error) {
            setErr(parseApiError(error).message)
        }
    }

    return (
        <div>
            <PublicNav />

            <main className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-2">
                <section className="hidden lg:block">
                    <h1 className="text-5xl font-black dark:text-white">
                        {t('auth.loginTitle')}
                    </h1>
                </section>

                <Card className="mx-auto w-full max-w-md">
                    <h2 className="text-2xl font-bold dark:text-white">
                        {t('auth.loginTitle')}
                    </h2>

                    <form className="mt-6 space-y-4" onSubmit={handleSubmit(sub)}>
                        <Field
                            label={t('auth.email')}
                            error={errors.email?.message as string}
                        >
                            <Input type="email" {...register('email')} />
                        </Field>

                        <Field
                            label={t('auth.password')}
                            error={errors.password?.message as string}
                        >
                            <Input type="password" {...register('password')} />
                        </Field>

                        {err ? <p className="text-sm text-rose-600">{err}</p> : null}

                        <Button className="w-full" disabled={mut.isPending}>
                            {mut.isPending ? t('loading') : t('auth.login')}
                        </Button>
                    </form>

                    <p className="mt-4 text-sm text-slate-500">
                        {t('auth.needAccount')}{' '}
                        <Link className="font-bold text-sky-600" to="/register">
                            {t('auth.register')}
                        </Link>
                    </p>
                </Card>
            </main>
        </div>
    )
}

export function Register() {
    const { t } = useTranslation()
    const nav = useNavigate()
    const [err, setErr] = useState('')
    const mut = usePatientRegister()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(regSchema),
    })

    async function sub(values: any) {
        setErr('')

        try {
            await mut.mutateAsync(values)
            nav('/app/dashboard')
        } catch (error) {
            setErr(parseApiError(error).message)
        }
    }

    return (
        <div>
            <PublicNav />

            <main className="mx-auto max-w-2xl px-4 py-10">
                <Card>
                    <h1 className="text-2xl font-bold dark:text-white">
                        {t('auth.registerTitle')}
                    </h1>

                    <form
                        className="mt-6 grid gap-4 sm:grid-cols-2"
                        onSubmit={handleSubmit(sub)}
                    >
                        <Field
                            label={t('auth.fullName')}
                            error={errors.fullName?.message as string}
                        >
                            <Input {...register('fullName')} />
                        </Field>

                        <Field
                            label={t('auth.email')}
                            error={errors.email?.message as string}
                        >
                            <Input type="email" {...register('email')} />
                        </Field>

                        <Field
                            label={t('auth.password')}
                            error={errors.password?.message as string}
                        >
                            <Input type="password" {...register('password')} />
                        </Field>

                        <Field label={t('auth.phone')}>
                            <Input {...register('phone')} />
                        </Field>

                        <Field label={t('auth.gender')}>
                            <Select {...register('gender')}>
                                <option value="">—</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </Select>
                        </Field>

                        <Field label={t('auth.dateOfBirth')}>
                            <Input type="date" {...register('dateOfBirth')} />
                        </Field>

                        {err ? (
                            <p className="text-sm text-rose-600 sm:col-span-2">{err}</p>
                        ) : null}

                        <div className="sm:col-span-2">
                            <Button className="w-full" disabled={mut.isPending}>
                                {mut.isPending ? t('loading') : t('auth.register')}
                            </Button>
                        </div>
                    </form>

                    <p className="mt-4 text-sm text-slate-500">
                        {t('auth.haveAccount')}{' '}
                        <Link className="font-bold text-sky-600" to="/login">
                            {t('auth.login')}
                        </Link>
                    </p>
                </Card>
            </main>
        </div>
    )
}

export function Unauthorized() {
    const { t } = useTranslation()

    return (
        <main className="grid min-h-screen place-items-center p-4">
            <Card className="text-center">
                <h1 className="text-2xl font-bold">{t('auth.unauthorized')}</h1>

                <Link to="/login">
                    <Button className="mt-6">{t('auth.login')}</Button>
                </Link>
            </Card>
        </main>
    )
}

export function NotFound() {
    return (
        <main className="grid min-h-screen place-items-center p-4">
            <Card className="text-center">
                <h1 className="text-3xl font-black">404</h1>
                <p>Page not found.</p>

                <Link to="/">
                    <Button className="mt-6">Home</Button>
                </Link>
            </Card>
        </main>
    )
}

export function Dashboard() {
    const { t, i18n } = useTranslation()
    const p = usePatientProfile()
    const a = usePatientAppointments()
    const r = usePatientRecords()
    const h = useHospitals()

    if (p.isLoading || a.isLoading || r.isLoading || h.isLoading) {
        return <Loading />
    }

    if (p.isError || a.isError || r.isError || h.isError) {
        return <ErrorBox />
    }

    const apps = a.data || []
    const recs = r.data || []
    const up = apps.filter(
        (item) =>
            new Date(item.scheduledStart).getTime() >= Date.now() &&
            item.status !== 'CANCELLED'
    )
    const next = up.sort(
        (x, y) =>
            new Date(x.scheduledStart).getTime() -
            new Date(y.scheduledStart).getTime()
    )[0]

    return (
        <Page
            title={t('dashboard.title')}
            subtitle={t('dashboard.subtitle')}
            actions={
                <Button
                    variant="secondary"
                    onClick={() => {
                        p.refetch()
                        a.refetch()
                        r.refetch()
                        h.refetch()
                    }}
                >
                    {t('refresh')}
                </Button>
            }
        >
            <div className="space-y-6">
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        {p.data?.profileImageUrl ? (
                            <div className="h-20 w-20 overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 shadow-xl dark:border-white/10 dark:bg-white/10">
                                <img
                                    src={getPatientImageUrl(p.data.profileImageUrl) || ''}
                                    alt="Patient profile"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <Avatar name={p.data?.fullName} size="xl" />
                        )}

                        <div>
                            <h2 className="text-2xl font-bold dark:text-white">
                                {p.data?.fullName}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {p.data?.user?.email || p.data?.phone || '—'}
                            </p>
                        </div>
                    </div>

                    <Link to="/app/profile">
                        <Button>{t('nav.profile')}</Button>
                    </Link>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        [t('dashboard.upcoming'), up.length],
                        [
                            t('dashboard.completed'),
                            apps.filter((item) => item.status === 'COMPLETED').length,
                        ],
                        [
                            t('dashboard.cancelled'),
                            apps.filter((item) => item.status === 'CANCELLED').length,
                        ],
                        [t('dashboard.records'), recs.length],
                    ].map(([label, value]) => (
                        <Card key={label as string}>
                            <p className="text-sm text-slate-500">{label}</p>
                            <p className="mt-2 text-3xl font-bold dark:text-white">
                                {n(value as number, i18n.language)}
                            </p>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold dark:text-white">
                            {t('dashboard.next')}
                        </h2>
                        {next ? (
                            <AppointmentCard a={next} />
                        ) : (
                            <Card>
                                <p>{t('dashboard.noNext')}</p>
                            </Card>
                        )}
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-bold dark:text-white">
                            {t('dashboard.quick')}
                        </h2>

                        <Link to="/app/hospitals">
                            <Button className="w-full">{t('dashboard.findCare')}</Button>
                        </Link>

                        <Link to="/app/appointments">
                            <Button variant="secondary" className="w-full">
                                {t('dashboard.viewAppointments')}
                            </Button>
                        </Link>

                        <Link to="/app/medical-basics">
                            <Button variant="secondary" className="w-full">
                                {t('dashboard.updateBasics')}
                            </Button>
                        </Link>
                    </section>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {recs.slice(0, 2).map((item) => (
                        <RecordCard key={item.id} r={item} />
                    ))}
                </div>
            </div>
        </Page>
    )
}

export function Profile() {
    const { t } = useTranslation()
    const q = usePatientProfile()
    const u = useUpdatePatientProfile()
    const token = usePatientAuthStore((state) => state.token)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const [form, setForm] = useState<any>({})
    const [msg, setMsg] = useState('')
    const [err, setErr] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [profileImageUrl, setProfileImageUrl] = useState<
        string | null | undefined
    >(undefined)
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (q.data) {
            setForm({
                fullName: q.data.fullName || '',
                phone: q.data.phone || '',
                gender: q.data.gender || '',
                dateOfBirth: q.data.dateOfBirth?.slice(0, 10) || '',
                emergencyContactName: q.data.emergencyContactName || '',
                emergencyContactPhone: q.data.emergencyContactPhone || '',
                line1: q.data.primaryAddress?.line1 || '',
                city: q.data.primaryAddress?.city || '',
                country: q.data.primaryAddress?.country || '',
            })

            setProfileImageUrl(q.data.profileImageUrl)
        }
    }, [q.data])

    if (q.isLoading) {
        return <Loading />
    }

    if (q.isError) {
        return <ErrorBox />
    }

    const shownImage = previewUrl || getPatientImageUrl(profileImageUrl)

    function chooseImage(file?: File | null) {
        setMsg('')
        setErr('')

        if (!file) {
            return
        }

        const allowed = ['image/jpeg', 'image/png', 'image/webp']

        if (!allowed.includes(file.type)) {
            setErr('Only JPG, PNG, and WEBP images are allowed.')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setErr('Image must be 2 MB or smaller.')
            return
        }

        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
    }

    async function uploadAvatar() {
        if (!selectedFile) {
            setErr('Choose an image first.')
            return
        }

        if (!token) {
            setErr('Missing patient token. Please log in again.')
            return
        }

        try {
            setIsUploading(true)
            setMsg('')
            setErr('')

            const formData = new FormData()
            formData.append('avatar', selectedFile)

            const res = await fetch(`${PATIENT_API_URL}/patient/profile/avatar`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data?.message || 'Profile picture upload failed.')
            }

            setProfileImageUrl(data.profileImageUrl)
            setSelectedFile(null)
            setPreviewUrl(null)
            setMsg('Profile picture uploaded successfully.')
            await q.refetch()
        } catch (error) {
            setErr(
                error instanceof Error
                    ? error.message
                    : 'Profile picture upload failed.'
            )
        } finally {
            setIsUploading(false)
        }
    }

    async function removeAvatar() {
        if (!token) {
            setErr('Missing patient token. Please log in again.')
            return
        }

        try {
            setIsDeleting(true)
            setMsg('')
            setErr('')

            const res = await fetch(`${PATIENT_API_URL}/patient/profile/avatar`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data?.message || 'Profile picture removal failed.')
            }

            setProfileImageUrl(null)
            setSelectedFile(null)
            setPreviewUrl(null)
            setMsg('Profile picture removed successfully.')
            await q.refetch()
        } catch (error) {
            setErr(
                error instanceof Error
                    ? error.message
                    : 'Profile picture removal failed.'
            )
        } finally {
            setIsDeleting(false)
        }
    }

    async function save() {
        setMsg('')
        setErr('')

        try {
            await u.mutateAsync({
                ...form,
                address: {
                    line1: form.line1,
                    city: form.city,
                    country: form.country,
                },
            })

            setMsg(t('profile.saved'))
            await q.refetch()
        } catch (error) {
            setErr(parseApiError(error).message)
        }
    }

    return (
        <Page title={t('profile.title')} subtitle={t('profile.subtitle')}>
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <Card className="h-fit text-center">
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            {shownImage ? (
                                <div className="h-28 w-28 overflow-hidden rounded-[2rem] border border-white/40 bg-white/70 shadow-xl dark:border-white/10 dark:bg-white/10">
                                    <img
                                        src={shownImage}
                                        alt="Patient profile"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            ) : (
                                <Avatar name={q.data?.fullName} size="xl" />
                            )}

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-2xl bg-sky-600 text-white shadow-lg"
                                aria-label="Choose profile picture"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => chooseImage(event.target.files?.[0])}
                        />

                        <h2 className="mt-4 text-xl font-bold dark:text-white">
                            {q.data?.fullName}
                        </h2>

                        <p className="text-sm text-slate-500">{q.data?.user?.email}</p>

                        <div className="mt-5 w-full rounded-3xl border border-white/40 bg-white/50 p-4 text-left dark:border-white/10 dark:bg-white/5">
                            <p className="text-sm font-black dark:text-white">
                                Profile Picture
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                                JPG, PNG, or WEBP. Maximum 2 MB.
                            </p>

                            {selectedFile ? (
                                <p className="mt-3 truncate text-xs text-slate-500">
                                    Selected: {selectedFile.name}
                                </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="h-4 w-4" /> Choose
                                </Button>

                                <Button
                                    onClick={uploadAvatar}
                                    disabled={!selectedFile || isUploading}
                                >
                                    <Upload className="h-4 w-4" />{' '}
                                    {isUploading ? 'Uploading...' : 'Upload'}
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={removeAvatar}
                                    disabled={!profileImageUrl || isDeleting}
                                >
                                    <Trash2 className="h-4 w-4" />{' '}
                                    {isDeleting ? 'Removing...' : 'Remove'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="grid gap-4 sm:grid-cols-2">
                    {[
                        'fullName',
                        'phone',
                        'gender',
                        'dateOfBirth',
                        'emergencyContactName',
                        'emergencyContactPhone',
                        'line1',
                        'city',
                        'country',
                    ].map((key) => (
                        <Field
                            key={key}
                            label={t(
                                key === 'fullName'
                                    ? 'auth.fullName'
                                    : key === 'phone'
                                        ? 'auth.phone'
                                        : key === 'gender'
                                            ? 'auth.gender'
                                            : key === 'dateOfBirth'
                                                ? 'auth.dateOfBirth'
                                                : `profile.${key}`
                            )}
                        >
                            <Input
                                type={key === 'dateOfBirth' ? 'date' : 'text'}
                                value={form[key] || ''}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        [key]: event.target.value,
                                    })
                                }
                            />
                        </Field>
                    ))}

                    <div className="sm:col-span-2">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                            Profile image URL
                        </p>

                        <p className="mt-1 break-all text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {profileImageUrl || '—'}
                        </p>
                    </div>

                    {msg ? <p className="text-emerald-600 sm:col-span-2">{msg}</p> : null}
                    {err ? <p className="text-rose-600 sm:col-span-2">{err}</p> : null}

                    <div className="sm:col-span-2">
                        <Button onClick={save} disabled={u.isPending}>
                            {u.isPending ? t('loading') : t('save')}
                        </Button>
                    </div>
                </Card>
            </div>
        </Page>
    )
}

export function Medical() {
    const { t } = useTranslation()
    const q = usePatientProfile()
    const u = useUpdatePatientProfile()
    const [form, setForm] = useState<any>({})
    const [msg, setMsg] = useState('')

    useEffect(() => {
        if (q.data) {
            setForm({
                allergies: q.data.allergies || '',
                currentMedications: q.data.currentMedications || '',
                medicalHistory: q.data.medicalHistory || '',
            })
        }
    }, [q.data])

    if (q.isLoading) {
        return <Loading />
    }

    if (q.isError) {
        return <ErrorBox />
    }

    async function save() {
        await u.mutateAsync(form)
        setMsg(t('medical.saved'))
    }

    return (
        <Page title={t('medical.title')} subtitle={t('medical.subtitle')}>
            <div className="space-y-5">
                {[
                    ['allergies', 'medical.allergies'],
                    ['currentMedications', 'medical.medications'],
                    ['medicalHistory', 'medical.history'],
                ].map(([key, label]) => (
                    <Card key={key}>
                        <Field label={t(label)}>
                            <Textarea
                                value={form[key] || ''}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        [key]: event.target.value,
                                    })
                                }
                            />
                        </Field>
                    </Card>
                ))}

                <p className="text-sm text-slate-500">{t('medical.structured')}</p>

                {msg ? <p className="text-emerald-600">{msg}</p> : null}

                <Button onClick={save}>{t('save')}</Button>
            </div>
        </Page>
    )
}

export function Hospitals() {
    const { t } = useTranslation()
    const q = useHospitals()
    const [s, setS] = useState('')

    const list = (q.data || []).filter((hospital) =>
        JSON.stringify(hospital).toLowerCase().includes(s.toLowerCase())
    )

    return (
        <Page title={t('hospital.title')} subtitle={t('hospital.subtitle')}>
            <Input
                placeholder={t('search')}
                value={s}
                onChange={(event) => setS(event.target.value)}
                className="mb-5"
            />

            {q.isLoading ? (
                <Loading />
            ) : q.isError ? (
                <ErrorBox />
            ) : list.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {list.map((hospital) => (
                        <HospitalCard key={hospital.id} h={hospital} />
                    ))}
                </div>
            ) : (
                <Empty text={t('hospital.noHospitals')} />
            )}
        </Page>
    )
}

export function HospitalDetails() {
    const { hospitalId } = useParams()
    const { t } = useTranslation()
    const q = useHospitalDoctors(hospitalId)
    const [s, setS] = useState('')

    if (q.isLoading) {
        return <Loading />
    }

    if (q.isError || !q.data) {
        return <ErrorBox />
    }

    const doctors = q.data.doctors.filter((doctor) =>
        JSON.stringify(doctor).toLowerCase().includes(s.toLowerCase())
    )

    return (
        <Page title={q.data.hospital.name} subtitle={addr(q.data.hospital.address)}>
            <Card className="mb-6">
                <div className="flex justify-between">
                    <div>
                        <b>{q.data.hospital.legalName || q.data.hospital.name}</b>
                        <p className="text-sm text-slate-500">
                            {q.data.hospital.contactEmail} · {q.data.hospital.contactPhone}
                        </p>
                    </div>

                    <Badge value={q.data.hospital.status} />
                </div>
            </Card>

            <Input
                placeholder={t('search')}
                value={s}
                onChange={(event) => setS(event.target.value)}
                className="mb-5"
            />

            {doctors.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {doctors.map((doctor) => (
                        <DoctorCard key={doctor.id} d={doctor} />
                    ))}
                </div>
            ) : (
                <Empty text={t('hospital.noDoctors')} />
            )}
        </Page>
    )
}

export function DoctorSlots() {
    const { id } = useParams() as any
    const { hospitalDoctorId } = useParams()
    const realId = hospitalDoctorId || id
    const { t } = useTranslation()
    const [sp] = useSearchParams()
    const [date, setDate] = useState(sp.get('date') || today())
    const [type, setType] = useState<AppointmentType>(
        (sp.get('appointmentType') as AppointmentType) || 'IN_PERSON'
    )
    const [selected, setSelected] = useState<DoctorSlot | null>(null)
    const q = useDoctorSlots(realId, date, type)

    return (
        <Page title={t('slots.title')} subtitle={t('slots.subtitle')}>
            <Card className="mb-5 grid gap-4 md:grid-cols-3">
                <Input
                    type="date"
                    value={date}
                    onChange={(event) => {
                        setDate(event.target.value)
                        setSelected(null)
                    }}
                />

                <Select
                    value={type}
                    onChange={(event) => setType(event.target.value as AppointmentType)}
                >
                    <option value="IN_PERSON">{t('status.IN_PERSON')}</option>
                    <option value="TELECONSULT">{t('status.TELECONSULT')}</option>
                </Select>

                <Link
                    to={`/app/book/${realId}?date=${date}&appointmentType=${type}${selected
                        ? `&startTime=${selected.startTime}&endTime=${selected.endTime}`
                        : ''
                        }`}
                >
                    <Button className="w-full" disabled={!selected}>
                        {t('slots.continue')}
                    </Button>
                </Link>
            </Card>

            {q.isLoading ? (
                <Loading />
            ) : q.isError ? (
                <ErrorBox />
            ) : q.data?.slots.length ? (
                <Card>
                    <h2 className="mb-4 font-bold">{q.data.doctor.fullName}</h2>
                    <Slots slots={q.data.slots} selected={selected} onSelect={setSelected} />
                </Card>
            ) : (
                <Empty text={t('slots.none')} />
            )}
        </Page>
    )
}

export function Book() {
    const { hospitalDoctorId } = useParams()
    const [sp] = useSearchParams()
    const { t } = useTranslation()
    const nav = useNavigate()
    const [date, setDate] = useState(sp.get('date') || today())
    const [type, setType] = useState<AppointmentType>(
        (sp.get('appointmentType') as AppointmentType) || 'IN_PERSON'
    )
    const [selected, setSelected] = useState<DoctorSlot | null>(
        sp.get('startTime') && sp.get('endTime') && hospitalDoctorId
            ? {
                date,
                dayOfWeek: '',
                startTime: sp.get('startTime')!,
                endTime: sp.get('endTime')!,
                appointmentType: type,
                hospitalDoctorId,
                doctorId: '',
                hospitalId: '',
            }
            : null
    )
    const [reason, setReason] = useState('')
    const [err, setErr] = useState('')
    const q = useDoctorSlots(hospitalDoctorId, date, type)
    const create = useCreateAppointment()

    async function submit() {
        if (!hospitalDoctorId || !selected) {
            setErr(t('slots.selectFirst'))
            return
        }

        try {
            const result = await create.mutateAsync({
                hospitalDoctorId,
                appointmentType: type,
                date,
                startTime: selected.startTime,
                endTime: selected.endTime,
                reason,
            })

            nav(`/app/appointments/${result.appointment.id}`)
        } catch (error) {
            setErr(parseApiError(error).message)
        }
    }

    return (
        <Page title={t('appointments.bookTitle')} subtitle={t('appointments.subtitle')}>
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-5">
                    <Card className="grid gap-4 sm:grid-cols-2">
                        <Input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />

                        <Select
                            value={type}
                            onChange={(event) =>
                                setType(event.target.value as AppointmentType)
                            }
                        >
                            <option value="IN_PERSON">{t('status.IN_PERSON')}</option>
                            <option value="TELECONSULT">{t('status.TELECONSULT')}</option>
                        </Select>
                    </Card>

                    {q.isLoading ? (
                        <Loading />
                    ) : q.isError ? (
                        <ErrorBox />
                    ) : q.data?.slots.length ? (
                        <Card>
                            <Slots
                                slots={q.data.slots}
                                selected={selected}
                                onSelect={setSelected}
                            />
                        </Card>
                    ) : (
                        <Empty text={t('slots.none')} />
                    )}
                </div>

                <Card className="h-fit">
                    <b>{t('slots.selected')}</b>

                    <p className="mt-2 text-sm text-slate-500">
                        {selected
                            ? `${selected.date} · ${selected.startTime}-${selected.endTime}`
                            : t('slots.selectFirst')}
                    </p>

                    <Textarea
                        className="mt-4"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder={t('reason')}
                    />

                    {err ? <p className="mt-3 text-sm text-rose-600">{err}</p> : null}

                    <Button
                        className="mt-5 w-full"
                        disabled={!selected || create.isPending}
                        onClick={submit}
                    >
                        {t('dashboard.book')}
                    </Button>
                </Card>
            </div>
        </Page>
    )
}

export function Appointments() {
    const { t } = useTranslation()
    const q = usePatientAppointments()
    const [s, setS] = useState('')
    const [st, setSt] = useState('all')

    const list = (q.data || []).filter(
        (appointment) =>
            (st === 'all' || appointment.status === st) &&
            JSON.stringify(appointment).toLowerCase().includes(s.toLowerCase())
    )

    return (
        <Page
            title={t('appointments.title')}
            subtitle={t('appointments.subtitle')}
            actions={
                <Link to="/app/hospitals">
                    <Button>{t('dashboard.book')}</Button>
                </Link>
            }
        >
            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_240px]">
                <Input
                    placeholder={t('search')}
                    value={s}
                    onChange={(event) => setS(event.target.value)}
                />

                <Select value={st} onChange={(event) => setSt(event.target.value)}>
                    {[
                        'all',
                        'REQUESTED',
                        'CONFIRMED',
                        'COMPLETED',
                        'CANCELLED',
                        'NO_SHOW',
                    ].map((status) => (
                        <option key={status} value={status}>
                            {status === 'all' ? 'All' : t(`status.${status}`)}
                        </option>
                    ))}
                </Select>
            </div>

            {q.isLoading ? (
                <Loading />
            ) : q.isError ? (
                <ErrorBox />
            ) : list.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {list.map((appointment) => (
                        <AppointmentCard key={appointment.id} a={appointment} />
                    ))}
                </div>
            ) : (
                <Empty text={t('appointments.none')} />
            )}
        </Page>
    )
}

export function AppointmentDetail() {
    const { id } = useParams()
    const { t } = useTranslation()
    const nav = useNavigate()

    const q = usePatientAppointment(id)
    const recs = usePatientRecords()
    const cancel = useCancelAppointment()
    const createChat = useCreateAppointmentChatThread()

    const [open, setOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [err, setErr] = useState('')

    if (q.isLoading) {
        return <Loading />
    }

    if (q.isError || !q.data || !id) {
        return <ErrorBox />
    }

    const a = q.data
    const rec = recs.data?.find((record) => record.appointmentId === id)

    async function doCancel() {
        try {
            await cancel.mutateAsync({
                id,
                cancellationReason: reason,
            })
            setOpen(false)
        } catch (error) {
            setErr(parseApiError(error).message)
        }
    }

    async function openChat() {
        try {
            setErr('')
            const thread = await createChat.mutateAsync(a.id)
            nav(`/app/chats/${thread.id}`)
        } catch (error) {
            setErr(parseApiError(error).message)
        }
    }

    return (
        <Page title={t('appointments.detail')} subtitle={a.id}>
            <div className="space-y-6">
                <Card>
                    <div className="flex justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold">
                                {a.hospital?.name || '—'}
                            </h2>

                            <p className="text-sm text-slate-500">
                                {a.doctor?.fullName} · {a.department?.name}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Badge value={a.status} />
                            <Badge value={a.appointmentType} />
                        </div>
                    </div>

                    <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <b>{t('appointments.start')}</b>
                            <p>{dt(a.scheduledStart)}</p>
                        </div>

                        <div>
                            <b>{t('appointments.end')}</b>
                            <p>{dt(a.scheduledEnd)}</p>
                        </div>

                        <div>
                            <b>{t('reason')}</b>
                            <p>{a.reason || '—'}</p>
                        </div>

                        <div>
                            <b>{t('appointments.cancelReason')}</b>
                            <p>{a.cancellationReason || '—'}</p>
                        </div>
                    </dl>

                    {err ? <p className="mt-4 text-rose-600">{err}</p> : null}

                    {a.appointmentType === 'TELECONSULT' ? (
                        <div className="mt-6 rounded-3xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-500/30 dark:bg-sky-500/10">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-wide text-sky-700 dark:text-sky-300">
                                        Online consultation
                                    </p>

                                    <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">
                                        {a.teleconsultSession?.providerName ||
                                            'Meeting link pending'}
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        Status:{' '}
                                        <span className="font-bold">
                                            {a.teleconsultSession?.status || 'PENDING'}
                                        </span>
                                    </p>

                                    {!a.teleconsultSession?.joinUrl ? (
                                        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                                            The hospital or doctor has not added the meeting link yet.
                                        </p>
                                    ) : null}
                                </div>

                                {a.teleconsultSession?.joinUrl ? (
                                    <Button
                                        disabled={a.teleconsultSession.status === 'ENDED'}
                                        onClick={() =>
                                            openExternalUrl(a.teleconsultSession?.joinUrl)
                                        }
                                    >
                                        {a.teleconsultSession.status === 'ENDED'
                                            ? 'Consultation Ended'
                                            : 'Join Consultation'}
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-6 flex flex-wrap gap-2">
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' ? (
                            <Button variant="danger" onClick={() => setOpen(true)}>
                                {t('appointments.cancelAppointment')}
                            </Button>
                        ) : null}

                        <Button
                            variant="secondary"
                            disabled={createChat.isPending}
                            onClick={openChat}
                        >
                            {createChat.isPending ? 'Opening chat...' : 'Open Chat'}
                        </Button>

                        <Link to={rec ? `/app/records/${rec.id}` : '/app/records'}>
                            <Button variant="secondary">{t('appointments.record')}</Button>
                        </Link>
                    </div>
                </Card>

                <ReviewPanel appointmentId={a.id} />
            </div>

            <Confirm
                open={open}
                title={t('appointments.cancelPrompt')}
                onClose={() => setOpen(false)}
                onConfirm={doCancel}
            >
                <Textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t('appointments.cancelReason')}
                />
            </Confirm>
        </Page>
    )
}

export function Records() {
    const { t } = useTranslation()
    const q = usePatientRecords()

    return (
        <Page title={t('records.title')} subtitle={t('records.subtitle')}>
            {q.isLoading ? (
                <Loading />
            ) : q.isError ? (
                <ErrorBox />
            ) : q.data?.length ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {q.data.map((record) => (
                        <RecordCard key={record.id} r={record} />
                    ))}
                </div>
            ) : (
                <Empty text={t('records.none')} />
            )}
        </Page>
    )
}

export function RecordDetail() {
    const { encounterId } = useParams()
    const { t } = useTranslation()
    const q = usePatientRecord(encounterId)

    if (q.isLoading) {
        return <Loading />
    }

    if (q.isError || !q.data) {
        return <ErrorBox />
    }

    const r = q.data

    return (
        <Page
            title={t('records.detail')}
            subtitle={`${t('records.recordId')}: ${r.id}`}
            actions={
                <Button
                    className="no-print"
                    variant="secondary"
                    onClick={() => print()}
                >
                    {t('print')}
                </Button>
            }
        >
            <Card>
                {[
                    [t('records.chief'), r.chiefComplaint],
                    [t('records.notes'), r.notes],
                    [t('records.diagnosis'), r.diagnosis],
                    [t('records.prescription'), r.prescription],
                    [t('records.follow'), r.followUpInstructions],
                ].map(([label, value]) => (
                    <div className="mb-5" key={label}>
                        <b>{label}</b>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                            {value || '—'}
                        </p>
                    </div>
                ))}
            </Card>
        </Page>
    )
}

export function Teleconsult() {
    const { appointmentId } = useParams()
    const { t } = useTranslation()
    const q = usePatientAppointment(appointmentId)

    if (q.isLoading) {
        return <Loading />
    }

    if (q.isError || !q.data) {
        return <ErrorBox />
    }

    const a = q.data
    const session = a.teleconsultSession

    return (
        <Page title={t('teleconsult.title')} subtitle={t('teleconsult.subtitle')}>
            <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
                <Card>
                    <div className="mb-4 flex justify-between">
                        <div>
                            <h2 className="text-xl font-bold">
                                {session?.providerName || t('teleconsult.waiting')}
                            </h2>

                            <p className="text-sm text-slate-500">
                                {session?.joinUrl
                                    ? 'Your consultation link is ready.'
                                    : 'The meeting link has not been added yet.'}
                            </p>
                        </div>

                        <Badge value={session?.status || a.status} />
                    </div>

                    <div className="grid min-h-[320px] place-items-center rounded-3xl border border-dashed p-8 text-center">
                        <div>
                            <b>{session?.providerName || t('teleconsult.video')}</b>

                            <p className="mt-3 break-all text-sm text-slate-500">
                                {session?.joinUrl || 'No meeting link available yet.'}
                            </p>

                            {session?.joinUrl ? (
                                <Button
                                    className="mt-6"
                                    disabled={session.status === 'ENDED'}
                                    onClick={() => openExternalUrl(session.joinUrl)}
                                >
                                    {session.status === 'ENDED'
                                        ? 'Consultation Ended'
                                        : 'Join Consultation'}
                                </Button>
                            ) : null}
                        </div>
                    </div>
                </Card>

                <Card>
                    <h3 className="font-bold">{a.doctor?.fullName}</h3>

                    <p className="mt-2 text-sm text-slate-500">
                        {a.hospital?.name} · {dt(a.scheduledStart)}
                    </p>

                    <p className="mt-6 text-sm">
                        Provider: {session?.providerName || '—'}
                    </p>

                    <p className="mt-2 text-sm">
                        Status: {session?.status || '—'}
                    </p>

                    <Link to={`/app/appointments/${a.id}`}>
                        <Button variant="secondary" className="mt-6 w-full">
                            Back to Appointment
                        </Button>
                    </Link>
                </Card>
            </div>
        </Page>
    )
}

export function Settings() {
    const { t } = useTranslation()
    const h = useHealth()
    const { patient, user, clearSession } = usePatientSession()

    return (
        <Page title={t('settings.title')} subtitle={t('settings.subtitle')}>
            <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                    <b>{t('settings.appearance')}</b>

                    <div className="mt-4 flex gap-3">
                        <Select
                            onChange={(event) =>
                                (document.documentElement.lang = event.target.value)
                            }
                        >
                            <option>en</option>
                        </Select>
                    </div>
                </Card>

                <Card>
                    <b>{t('settings.api')}</b>

                    <p className="mt-2 text-sm text-slate-500">
                        {h.data?.service || 'Patient API'} · {h.data?.timestamp || '—'}
                    </p>

                    <Badge value={h.isError ? 'SUSPENDED' : 'ACTIVE'} />
                </Card>

                <Card>
                    <b>{t('settings.account')}</b>

                    <p className="mt-2 text-sm text-slate-500">
                        {patient?.fullName} · {user?.email}
                    </p>

                    <Link to="/app/profile">
                        <Button className="mt-4" variant="secondary">
                            Manage Profile Picture
                        </Button>
                    </Link>
                </Card>

                <Card>
                    <b>Future controls</b>

                    <p className="mt-2 text-sm text-slate-500">{t('settings.security')}</p>
                    <p className="mt-2 text-sm text-slate-500">
                        {t('settings.notifications')}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">{t('settings.data')}</p>

                    <Button variant="danger" className="mt-4" onClick={clearSession}>
                        {t('logout')}
                    </Button>
                </Card>
            </div>
        </Page>
    )
}

export function Account() {
    const { t } = useTranslation()
    const nav = useNavigate()
    const { user, patient, clearSession } = usePatientSession()

    return (
        <Page title={t('account.title')} subtitle={t('account.subtitle')}>
            <Card>
                <Badge value="ACTIVE" />

                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                        <b>{t('account.userId')}</b>
                        <p className="break-all">{user?.id}</p>
                    </div>

                    <div>
                        <b>{t('account.patientId')}</b>
                        <p className="break-all">{patient?.id}</p>
                    </div>

                    <div>
                        <b>{t('auth.email')}</b>
                        <p>{user?.email}</p>
                    </div>

                    <div>
                        <b>{t('account.role')}</b>
                        <p>{user?.primaryRole}</p>
                    </div>
                </dl>

                <Button
                    variant="danger"
                    className="mt-6"
                    onClick={() => {
                        clearSession()
                        nav('/login')
                    }}
                >
                    {t('logout')}
                </Button>
            </Card>
        </Page>
    )
}