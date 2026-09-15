import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'

type LocationState = {
  from?: { pathname?: string }
}

export function LoginPage() {
  const { user, isLoading, error, login } = useAuth()
  const [usr, setUsr] = useState('')
  const [pwd, setPwd] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const redirect = new URLSearchParams(location.search).get('redirect')
  const safeRedirect = redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined
  const destination = state?.from?.pathname ?? safeRedirect ?? '/'

  if (isLoading) {
    return <LoadingScreen />
  }
  if (user) {
    return <Navigate to={destination} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedUsr = usr.trim()
    if (!normalizedUsr || !pwd) {
      setValidationError('Введите логин и пароль')
      return
    }

    setValidationError(null)
    setSubmitting(true)
    try {
      await login(normalizedUsr, pwd)
      navigate(destination, { replace: true })
    } catch {
      // AuthProvider exposes a safe, user-facing error message.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">D</div>
        <div className="login-heading">
          <p className="eyebrow">Dance Platform</p>
          <h1 id="login-title">Добро пожаловать</h1>
          <p>Войдите, чтобы продолжить работу</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="usr">
            Email или логин
            <input
              id="usr"
              name="usr"
              type="text"
              autoComplete="username"
              value={usr}
              onChange={(event) => setUsr(event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(validationError)}
              autoFocus
            />
          </label>

          <label htmlFor="pwd">
            Пароль
            <input
              id="pwd"
              name="pwd"
              type="password"
              autoComplete="current-password"
              value={pwd}
              onChange={(event) => setPwd(event.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(validationError)}
            />
          </label>

          {(validationError || error) && (
            <div className="form-error" role="alert">
              {validationError ?? error}
            </div>
          )}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting && <span className="button-spinner" aria-hidden="true" />}
            {submitting ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </section>
    </main>
  )
}
