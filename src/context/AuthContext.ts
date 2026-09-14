import { createContext } from 'react'

export type AuthContextValue = {
  user: string | null
  isLoading: boolean
  error: string | null
  login: (usr: string, pwd: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
