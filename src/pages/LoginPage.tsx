import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resendVerificationEmail, FrappeApiError } from '../api/auth'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../stores/authStore'

type LocationState = {
  from?: { pathname?: string }
}

export function LoginPage() {
  const { user, isLoading, error, login } = useAuth()
  const unverifiedEmail = useAuthStore((state) => state.unverifiedEmail)

  const [usr, setUsr] = useState('')
  const [pwd, setPwd] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Resend state for unverified accounts
  const [resending, setResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

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
    setResendStatus(null)
    setSubmitting(true)
    try {
      await login(normalizedUsr, pwd)
      navigate(destination, { replace: true })
    } catch {
      // The auth store exposes a safe, user-facing error message and updates unverifiedEmail.
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendActivation() {
    const targetEmail = unverifiedEmail || usr.trim()
    if (!targetEmail || resending) return

    setResending(true)
    setResendStatus(null)
    try {
      const res = await resendVerificationEmail(targetEmail)
      setResendStatus(res.message || 'Ссылка для активации отправлена на вашу почту.')
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setResendStatus(err.message)
      } else {
        setResendStatus('Не удалось отправить ссылку повторно. Попробуйте позже.')
      }
    } finally {
      setResending(false)
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

        {unverifiedEmail && (
          <div className="unverified-callout" role="alert">
            <p className="unverified-title">Аккаунт не активирован</p>
            <p className="unverified-text">
              Адрес <strong>{unverifiedEmail}</strong> еще не подтвержден. Проверьте ваш почтовый ящик или отправьте ссылку повторно.
            </p>
            <button
              type="button"
              className="unverified-action-button"
              onClick={handleResendActivation}
              disabled={resending}
            >
              {resending ? 'Отправляем…' : 'Отправить ссылку активации повторно'}
            </button>
            {resendStatus && (
              <p className="unverified-status">{resendStatus}</p>
            )}
          </div>
        )}

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

          {(validationError || error) && !unverifiedEmail && (
            <div className="form-error" role="alert">
              {validationError ?? error}
            </div>
          )}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting && <span className="button-spinner" aria-hidden="true" />}
            {submitting ? 'Входим…' : 'Войти'}
          </button>

          <p className="auth-footer-text">
            Еще нет аккаунта? <Link to="/register" className="auth-footer-link">Зарегистрироваться</Link>
          </p>
        </form>
      </section>
    </main>
  )
}
