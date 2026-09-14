import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function HomePage() {
  const { user, logout, error } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      // The context keeps the error available for display.
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="home-page">
      <section className="home-card">
        <p className="eyebrow">Dance Platform</p>
        <h1>Главная страница</h1>
        <p>Вы вошли как <strong>{user}</strong></p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button
          className="secondary-button"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Выходим…' : 'Выйти'}
        </button>
      </section>
    </main>
  )
}
