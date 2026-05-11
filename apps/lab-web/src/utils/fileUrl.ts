import { LAB_API_URL } from '../api/client'

export function toAbsoluteFileUrl(fileUrl?: string | null) {
  if (!fileUrl) return ''
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl
  return `${LAB_API_URL.replace(/\/$/, '')}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`
}
