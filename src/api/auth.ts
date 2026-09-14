import { frappeFetch } from './frappe'

export { FrappeApiError } from './frappe'

type FrappeResponse<T> = { message: T }

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
  const response = await frappeFetch<FrappeResponse<string>>('/api/method/frappe.auth.get_logged_user')
  return response.message
}
