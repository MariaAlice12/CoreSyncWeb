import { getToken } from '../utils/token'

export const BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  // Com FormData o navegador define o Content-Type (multipart + boundary).
  const isFormData = options?.body instanceof FormData
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options?.headers as Record<string, string>) ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
    throw new Error(message ?? `HTTP ${response.status}: ${response.statusText}`)
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export default request
