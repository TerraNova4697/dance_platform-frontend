import { create } from 'zustand'
import {
  FrappeApiError,
  getLoggedUser,
  login as loginRequest,
  logout as logoutRequest,
  type PersonSummary,
} from '../api/auth'

type AuthState = {
  user: string | null
  person: PersonSummary | null
  isLoading: boolean
  error: string | null
  unverifiedEmail: string | null
  initialize: () => Promise<void>
  checkAuth: () => Promise<void>
  login: (usr: string, pwd: string) => Promise<void>
  logout: () => Promise<void>
  setUserSession: (user: string, person?: PersonSummary | null) => void
  clearUnverifiedState: () => void
}

function parseLoginError(error: unknown, submittedEmail?: string): { message: string; unverifiedEmail: string | null } {
  if (error instanceof FrappeApiError) {
    const raw = error.message.toLowerCase()
    if (
      raw.includes('disabled') ||
      raw.includes('отключен') ||
      raw.includes('заблокирован') ||
      raw.includes('not verified')
    ) {
      return {
        message: 'Ваш аккаунт ожидает подтверждения почты.',
        unverifiedEmail: submittedEmail ?? null,
      }
    }
    if (error.status === 401 || error.status === 403) {
      return {
        message: 'Неверный логин или пароль',
        unverifiedEmail: null,
      }
    }
    if (error.status === 429) {
      return {
        message: 'Слишком много попыток входа. Пожалуйста, подождите минуту.',
        unverifiedEmail: null,
      }
    }
    return {
      message: error.message,
      unverifiedEmail: null,
    }
  }

  if (error instanceof TypeError) {
    return {
      message: 'Не удалось связаться с сервером. Проверьте подключение.',
      unverifiedEmail: null,
    }
  }

  return {
    message: 'Произошла непредвиденная ошибка',
    unverifiedEmail: null,
  }
}

let initializationPromise: Promise<void> | null = null
let isInitialized = false

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  person: null,
  isLoading: true,
  error: null,
  unverifiedEmail: null,

  initialize: async () => {
    if (isInitialized) {
      return
    }
    if (!initializationPromise) {
      initializationPromise = get().checkAuth().finally(() => {
        isInitialized = true
        initializationPromise = null
      })
    }
    await initializationPromise
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const loggedUser = await getLoggedUser()
      set({
        user: loggedUser && loggedUser !== 'Guest' ? loggedUser : null,
        error: null,
      })
    } catch (requestError: unknown) {
      const isUnauthorized = requestError instanceof FrappeApiError
        && (requestError.status === 401 || requestError.status === 403)
      set({
        user: null,
        error: isUnauthorized ? null : parseLoginError(requestError).message,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (usr: string, pwd: string) => {
    set({ error: null, unverifiedEmail: null })
    try {
      await loginRequest(usr, pwd)
      const loggedUser = await getLoggedUser()
      if (!loggedUser || loggedUser === 'Guest') {
        throw new FrappeApiError('Сессия не была создана', 401)
      }
      set({ user: loggedUser, unverifiedEmail: null, error: null })
    } catch (requestError: unknown) {
      const { message, unverifiedEmail } = parseLoginError(requestError, usr)
      set({ user: null, error: message, unverifiedEmail })
      throw requestError
    }
  },

  logout: async () => {
    set({ error: null, unverifiedEmail: null })
    try {
      await logoutRequest()
    } catch (requestError: unknown) {
      set({ error: parseLoginError(requestError).message })
      throw requestError
    } finally {
      set({ user: null, person: null })
    }
  },

  setUserSession: (user: string, person: PersonSummary | null = null) => {
    set({ user, person, unverifiedEmail: null, error: null })
  },

  clearUnverifiedState: () => {
    set({ unverifiedEmail: null })
  },
}))
