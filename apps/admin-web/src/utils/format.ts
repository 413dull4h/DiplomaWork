import i18n from '@/i18n'

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat(i18n.language || 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat(i18n.language || 'en', {
      dateStyle: 'medium',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function formatNumber(value?: number | null) {
  return new Intl.NumberFormat(i18n.language || 'en').format(value ?? 0)
}

export function addressSummary(address?: { line1?: string | null; city?: string | null; state?: string | null; postalCode?: string | null; country?: string | null } | null) {
  if (!address) return '—'
  return [address.line1, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ')
}

export function metadataPreview(metadata?: Record<string, unknown> | null) {
  if (!metadata) return '—'
  const value = JSON.stringify(metadata)
  return value.length > 110 ? `${value.slice(0, 110)}…` : value
}
