import { frappeFetch } from './frappe'

export { FrappeApiError } from './frappe'

type FrappeResponse<T> = { message: T }

export type LoginResult = {
  message: string
  full_name?: string
  home_page?: string
  redirect_to?: string
}

export type PersonSummary = {
  name: string
  first_name: string
  last_name: string
  photo: string | null
}

export type RegisterPayload = {
  email: string
  first_name: string
  last_name: string
  password: string
}

export type RegisterResult = {
  success: boolean
  message: string
}

export type VerifyEmailResult = {
  success: boolean
  message: string
  user: string
  person: PersonSummary
}

export type ResendVerificationResult = {
  success: boolean
  message: string
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
  const response = await frappeFetch<FrappeResponse<string>>('/api/method/frappe.auth.get_logged_user')
  return response.message
}

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const response = await frappeFetch<FrappeResponse<RegisterResult>>(
    '/api/method/dance_platform.api.auth.register',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
  return response.message
}

export async function verifyEmail(key: string): Promise<VerifyEmailResult> {
  const response = await frappeFetch<FrappeResponse<VerifyEmailResult>>(
    '/api/method/dance_platform.api.auth.verify_email',
    {
      method: 'POST',
      body: JSON.stringify({ key }),
    }
  )
  return response.message
}

export async function resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
  const response = await frappeFetch<FrappeResponse<ResendVerificationResult>>(
    '/api/method/dance_platform.api.auth.resend_verification_email',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    }
  )
  return response.message
}
