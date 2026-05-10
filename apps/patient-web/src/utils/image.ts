const API_URL =
  import.meta.env.VITE_PATIENT_API_URL || 'http://localhost:4003'

export function getImageUrl(path?: string | null) {
  if (!path) {
    return null
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${API_URL}${path}`
}