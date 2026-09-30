import { create } from 'zustand'
import {
  FrappeApiError,
  getLoggedUser,
  login as loginRequest,
  logout as logoutRequest,
} from '../api/auth'

type AuthState = {
  user: string | null
  isLoading: boolean
  error: string | null
  initialize: () => Promise<void>
  checkAuth: () => Promise<void>
  login: (usr: string, pwd: string) => Promise<void>
  logout: () => Promise<void>
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FrappeApiError) {
    if (error.status === 401 || error.status === 403) {
      return 'Неверный логин или пароль'
    }
    return error.message
  }

  if (error instanceof TypeError) {
    return 'Не удалось связаться с сервером. Проверьте подключение.'
  }
  return 'Произошла непредвиденная ошибка'
}

let initializationPromise: Promise<void> | null = null
let isInitialized = false

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

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
        error: isUnauthorized ? null : getAuthErrorMessage(requestError),
      })
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (usr: string, pwd: string) => {
    set({ error: null })
    try {
      await loginRequest(usr, pwd)
      const loggedUser = await getLoggedUser()
      if (!loggedUser || loggedUser === 'Guest') {
        throw new FrappeApiError('Сессия не была создана', 401)
      }
      set({ user: loggedUser })
    } catch (requestError: unknown) {
      set({ user: null, error: getAuthErrorMessage(requestError) })
      throw requestError
    }
  },

  logout: async () => {
    set({ error: null })
    try {
      await logoutRequest()
    } catch (requestError: unknown) {
      set({ error: getAuthErrorMessage(requestError) })
      throw requestError
    } finally {
      set({ user: null })
    }
  },
}))
