import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyEmail, resendVerificationEmail, FrappeApiError } from '../api/auth'
import { useAuthStore } from '../stores/authStore'

type VerifyState = 'loading' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const key = searchParams.get('key')
  const navigate = useNavigate()

  const initialKeyMissing = !key || !key.trim()
  const [status, setStatus] = useState<VerifyState>(() => (initialKeyMissing ? 'error' : 'loading'))
  const [errorMessage, setErrorMessage] = useState<string | null>(() =>
    initialKeyMissing ? 'Ссылка активации не содержит обязательного ключа.' : null
  )
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Resend form state for recovery
  const [resendEmail, setResendEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)

  const hasExecutedRef = useRef(false)

  useEffect(() => {
    if (initialKeyMissing || hasExecutedRef.current) return
    hasExecutedRef.current = true

    async function executeVerification() {
      try {
        const result = await verifyEmail(key!.trim())
        // Immediately sync user session into global store
        useAuthStore.getState().setUserSession(result.user, result.person)
        setStatus('success')
        setSuccessMessage(result.message || 'Аккаунт успешно активирован!')

        // Auto-redirect to onboarding after 2 seconds
        const timer = setTimeout(() => {
          navigate('/onboarding', { replace: true })
        }, 2000)
        return () => clearTimeout(timer)
      } catch (err: unknown) {
        setStatus('error')
        if (err instanceof FrappeApiError) {
          setErrorMessage(err.message)
        } else if (err instanceof TypeError) {
          setErrorMessage('Не удалось связаться с сервером. Проверьте подключение.')
        } else {
          setErrorMessage('Произошла непредвиденная ошибка при активации аккаунта.')
        }
      }
    }

    void executeVerification()
  }, [key, navigate, initialKeyMissing])

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = resendEmail.trim().toLowerCase()
    if (!trimmed) {
      setResendError('Введите адрес электронной почты')
      return
    }

    setResending(true)
    setResendResult(null)
    setResendError(null)

    try {
      const res = await resendVerificationEmail(trimmed)
      setResendResult(res.message || 'Ссылка для активации отправлена на почту.')
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setResendError(err.message)
      } else {
        setResendError('Не удалось отправить ссылку повторно. Попробуйте позже.')
      }
    } finally {
      setResending(false)
    }
  }

  // --- Verifying State ---
  if (status === 'loading') {
    return (
      <main className="login-page">
        <section className="login-card" aria-busy="true">
          <div className="brand-mark" aria-hidden="true">D</div>
          <div className="login-heading">
            <p className="eyebrow">Dance Platform</p>
            <h1>Активация аккаунта</h1>
            <p>Проверяем ссылку активации…</p>
          </div>
          <div className="loading-state">
            <span className="button-spinner button-spinner-large" aria-hidden="true" />
            <p className="loading-subtext">Пожалуйста, подождите, это займет всего пару секунд.</p>
          </div>
        </section>
      </main>
    )
  }

  // --- Success State ---
  if (status === 'success') {
    return (
      <main className="login-page">
        <section className="login-card" aria-labelledby="verify-success-title">
          <div className="brand-mark brand-mark-success" aria-hidden="true">✓</div>
          <div className="login-heading">
            <p className="eyebrow">Dance Platform</p>
            <h1 id="verify-success-title">Почта подтверждена!</h1>
            <p>{successMessage}</p>
          </div>
          <div className="auth-instructions">
            <p>Сессия успешно создана. Переходим к заполнению анкеты профиля…</p>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/onboarding', { replace: true })}
          >
            Заполнить анкету профиля
          </button>
        </section>
      </main>
    )
  }

  // --- Error State ---
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="verify-error-title">
        <div className="brand-mark brand-mark-error" aria-hidden="true">!</div>
        <div className="login-heading">
          <p className="eyebrow">Dance Platform</p>
          <h1 id="verify-error-title">Ошибка активации</h1>
          <p>{errorMessage}</p>
        </div>

        <div className="auth-instructions">
          <p>
            Возможно, срок действия ссылки истек (ссылка действительна 24 часа) или она уже была использована ранее.
          </p>
        </div>

        <form className="resend-form" onSubmit={handleResend} noValidate>
          <label htmlFor="resendEmail">
            Запросить новую ссылку на email:
            <input
              id="resendEmail"
              name="resendEmail"
              type="email"
              autoComplete="email"
              placeholder="athlete@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              disabled={resending}
            />
          </label>

          {resendError && (
            <div className="form-error" role="alert">
              {resendError}
            </div>
          )}

          {resendResult && (
            <div className="form-success" role="status">
              {resendResult}
            </div>
          )}

          <button className="secondary-button" type="submit" disabled={resending}>
            {resending ? 'Отправляем…' : 'Отправить новую ссылку'}
          </button>
        </form>

        <div className="auth-actions" style={{ marginTop: '18px' }}>
          <Link to="/login" className="auth-nav-link">
            Вернуться на страницу входа
          </Link>
        </div>
      </section>
    </main>
  )
}
