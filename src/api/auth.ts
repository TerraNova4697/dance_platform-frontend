type FrappeResponse<T> = {
  message: T
}

type FrappeWindow = Window & {
  frappe?: {
    csrf_token?: string
  }
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE'])

export class FrappeApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'FrappeApiError'
    this.status = status
  }
}

function getCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  if (!cookie) {
    return null
  }

  try {
    return decodeURIComponent(cookie.slice(prefix.length))
  } catch {
    return cookie.slice(prefix.length)
  }
}

function getCsrfToken(): string | null {
  return getCookie('csrf_token') ?? (window as FrappeWindow).frappe?.csrf_token ?? null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) {
    return fallback
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  if (typeof payload.exception === 'string' && payload.exception.trim()) {
    return payload.exception
  }

  return fallback
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function frappeFetch<T>(
  path: string,
  options: Omit<RequestInit, 'credentials'> = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  headers.set('Accept', 'application/json')
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (MUTATING_METHODS.has(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers.set('X-Frappe-CSRF-Token', csrfToken)
    }
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })
  const payload = await readResponseBody(response)

  if (!response.ok) {
    throw new FrappeApiError(
      getErrorMessage(payload, `Ошибка запроса (${response.status})`),
      response.status,
    )
  }

  return payload as T
}

export type LoginResult = {
  message: string
  full_name?: string
  home_page?: string
  redirect_to?: string
}

export async function login(usr: string, pwd: string): Promise<LoginResult> {
  return frappeFetch<LoginResult>('/api/method/login', {
    method: 'POST',
    body: JSON.stringify({ usr, pwd }),
  })
}

export async function logout(): Promise<void> {
  await frappeFetch<unknown>('/api/method/logout', { method: 'POST' })
}

export async function getLoggedUser(): Promise<string> {
  const response = await frappeFetch<FrappeResponse<string>>(
    '/api/method/frappe.auth.get_logged_user',
  )
  return response.message
}
