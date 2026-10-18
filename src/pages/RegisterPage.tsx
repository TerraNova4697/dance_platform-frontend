import { useState, useEffect, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { register, resendVerificationEmail, FrappeApiError } from '../api/auth'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../hooks/useAuth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterPage() {
  const { user, isLoading } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Success state: user registered, awaiting email verification
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {}

    if (!firstName.trim()) {
      errors.firstName = 'Введите имя'
    } else if (firstName.trim().length < 2) {
      errors.firstName = 'Имя должно содержать минимум 2 символа'
    }

    if (!lastName.trim()) {
      errors.lastName = 'Введите фамилию'
    } else if (lastName.trim().length < 2) {
      errors.lastName = 'Фамилия должна содержать минимум 2 символа'
    }

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      errors.email = 'Введите адрес электронной почты'
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Введите корректный email адрес'
    }

    if (!password) {
      errors.password = 'Придумайте пароль'
    } else if (password.length < 8) {
      errors.password = 'Пароль должен содержать минимум 8 символов'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Повторите пароль'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают'
    }

    if (!termsAccepted) {
      errors.terms = 'Необходимо согласиться с условиями использования'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setApiError(null)

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    const normalizedEmail = email.trim().toLowerCase()

    try {
      await register({
        email: normalizedEmail,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
      })
      setRegisteredEmail(normalizedEmail)
      setResendCooldown(60)
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setApiError(err.message)
      } else if (err instanceof TypeError) {
        setApiError('Не удалось связаться с сервером. Проверьте подключение.')
      } else {
        setApiError('Произошла непредвиденная ошибка при регистрации')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    if (!registeredEmail || resendCooldown > 0 || resending) return

    setResending(true)
    setResendMessage(null)
    setApiError(null)

    try {
      const res = await resendVerificationEmail(registeredEmail)
      setResendMessage(res.message || 'Ссылка для активации отправлена повторно')
      setResendCooldown(60)
    } catch (err: unknown) {
      if (err instanceof FrappeApiError) {
        setApiError(err.message)
      } else {
        setApiError('Не удалось отправить письмо повторно. Попробуйте позже.')
      }
    } finally {
      setResending(false)
    }
  }

  // --- Awaiting confirmation view ---
  if (registeredEmail) {
    return (
      <main className="login-page">
        <section className="login-card" aria-labelledby="register-success-title">
          <div className="brand-mark brand-mark-success" aria-hidden="true">✓</div>
          <div className="login-heading">
            <p className="eyebrow">Dance Platform</p>
            <h1 id="register-success-title">Проверьте вашу почту</h1>
            <p>
              Мы отправили письмо со ссылкой для активации аккаунта на адрес{' '}
              <strong>{registeredEmail}</strong>.
            </p>
          </div>

          <div className="auth-instructions">
            <p>
              Перейдите по ссылке в письме, чтобы подтвердить адрес и активировать аккаунт. Ссылка действительна в течение 24 часов.
            </p>
          </div>

          {resendMessage && (
            <div className="form-success" role="status">
              {resendMessage}
            </div>
          )}

          {apiError && (
            <div className="form-error" role="alert">
              {apiError}
            </div>
          )}

          <div className="auth-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
            >
              {resending ? 'Отправляем…' : resendCooldown > 0 ? `Отправить снова через ${resendCooldown}с` : 'Отправить письмо повторно'}
            </button>

            <Link to="/login" className="auth-nav-link">
              Вернуться на страницу входа
            </Link>
          </div>
        </section>
      </main>
    )
  }

  // --- Registration form view ---
  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="register-title">
        <div className="brand-mark" aria-hidden="true">D</div>
        <div className="login-heading">
          <p className="eyebrow">Dance Platform</p>
          <h1 id="register-title">Создать аккаунт</h1>
          <p>Заполните форму для регистрации на платформе</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <label htmlFor="firstName">
              Имя
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(validationErrors.firstName)}
                autoFocus
              />
              {validationErrors.firstName && (
                <span className="field-error">{validationErrors.firstName}</span>
              )}
            </label>

            <label htmlFor="lastName">
              Фамилия
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(validationErrors.lastName)}
              />
              {validationErrors.lastName && (
                <span className="field-error">{validationErrors.lastName}</span>
              )}
            </label>
          </div>

          <label htmlFor="email">
            Электронная почта
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(validationErrors.email)}
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </label>

          <label htmlFor="password">
            Пароль
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(validationErrors.password)}
            />
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
          </label>

          <label htmlFor="confirmPassword">
            Подтверждение пароля
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(validationErrors.confirmPassword)}
            />
            {validationErrors.confirmPassword && (
              <span className="field-error">{validationErrors.confirmPassword}</span>
            )}
          </label>

          <label className="checkbox-label" htmlFor="terms">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={submitting}
              aria-invalid={Boolean(validationErrors.terms)}
            />
            <span>
              Я принимаю условия <span className="terms-link">пользовательского соглашения</span> и политики конфиденциальности
            </span>
          </label>
          {validationErrors.terms && (
            <span className="field-error">{validationErrors.terms}</span>
          )}

          {apiError && (
            <div className="form-error" role="alert">
              {apiError}
            </div>
          )}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting && <span className="button-spinner" aria-hidden="true" />}
            {submitting ? 'Создаем аккаунт…' : 'Зарегистрироваться'}
          </button>

          <p className="auth-footer-text">
            Уже есть аккаунт? <Link to="/login" className="auth-footer-link">Войти</Link>
          </p>
        </form>
      </section>
    </main>
  )
}

