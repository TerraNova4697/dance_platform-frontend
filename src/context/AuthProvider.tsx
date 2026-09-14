import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  FrappeApiError,
  getLoggedUser,
  login as loginRequest,
  logout as logoutRequest,
} from '../api/auth'
import { AuthContext, type AuthContextValue } from './AuthContext'

type AuthProviderProps = {
  children: ReactNode
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      const loggedUser = await getLoggedUser()
      setUser(loggedUser && loggedUser !== 'Guest' ? loggedUser : null)
      setError(null)
    } catch (requestError: unknown) {
      setUser(null)
      if (
        requestError instanceof FrappeApiError &&
        (requestError.status === 401 || requestError.status === 403)
      ) {
        setError(null)
      } else {
        setError(getAuthErrorMessage(requestError))
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (usr: string, pwd: string) => {
    setError(null)
    try {
      await loginRequest(usr, pwd)
      const loggedUser = await getLoggedUser()
      if (!loggedUser || loggedUser === 'Guest') {
        throw new FrappeApiError('Сессия не была создана', 401)
      }
      setUser(loggedUser)
    } catch (requestError: unknown) {
      setUser(null)
      setError(getAuthErrorMessage(requestError))
      throw requestError
    }
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await logoutRequest()
    } catch (requestError: unknown) {
      setError(getAuthErrorMessage(requestError))
      throw requestError
    } finally {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkAuth()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [checkAuth])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, error, login, logout, checkAuth }),
    [user, isLoading, error, login, logout, checkAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
