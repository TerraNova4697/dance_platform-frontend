import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTrainingBookingDetails, cancelTrainingBooking } from '../../api/trainers'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardProfile } from '../../services/dashboard'
import '../trainers/trainers.css'

export function TrainingBookingDetailsPage() {
  const { bookingId = '' } = useParams<{ bookingId: string }>()
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()

  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user),
  })

  const bookingQuery = useQuery({
    queryKey: ['training-booking', bookingId],
    queryFn: () => getTrainingBookingDetails(bookingId),
    enabled: Boolean(bookingId),
  })

  const booking = bookingQuery.data
  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  async function handleCancelBooking() {
    if (!bookingId || cancelLoading) return
    setCancelLoading(true)
    setCancelError(null)
    try {
      await cancelTrainingBooking(bookingId)
      await queryClient.invalidateQueries({ queryKey: ['training-booking', bookingId] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowConfirmCancel(false)
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : 'Не удалось отменить запись')
    } finally {
      setCancelLoading(false)
    }
  }

  if (bookingQuery.isPending) {
    return (
      <div className="dashboard-page trainers-catalog-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="trainers-main">
          <div className="trainers-loading">Загрузка информации о записи…</div>
        </main>
      </div>
    )
  }

  if (bookingQuery.isError || !booking) {
    return (
      <div className="dashboard-page trainers-catalog-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="trainers-main">
          <div className="trainers-empty-state">
            <h3>Запись на тренировку не найдена</h3>
            <p>Возможно, запись была удалена или у вас нет к ней доступа.</p>
            <Link to="/" className="button primary">
              На главную
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const startFormatted = new Date(booking.slot.startAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const endFormatted = new Date(booking.slot.endAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const statusLabels: Record<string, { label: string; class: string }> = {
    Booked: { label: 'Забронировано', class: 'booked' },
    'Cancelled By User': { label: 'Отменено вами', class: 'cancelled' },
    'Cancelled By Trainer': { label: 'Отменено тренером', class: 'cancelled' },
    Completed: { label: 'Завершено', class: 'completed' },
    Expired: { label: 'Истекло', class: 'cancelled' },
  }
  const statusInfo = statusLabels[booking.status] || { label: booking.status, class: 'default' }

  return (
    <div className="dashboard-page trainers-catalog-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="trainers-main single-booking-main">
        <div className="booking-top-nav">
          <Link to="/" className="back-link">
            ← На главную
          </Link>
        </div>

        <div className="booking-card">
          <div className="booking-header">
            <span className={`booking-status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
            <h1>{booking.offering.title}</h1>
            <div className="booking-type-sub">
              {booking.offering.trainingType === 'Individual' ? 'Индивидуальная тренировка' : 'Групповая тренировка'}
              {booking.offering.direction ? ` · ${booking.offering.direction}` : ''}
            </div>
          </div>

          <div className="booking-trainer-box">
            {booking.trainer.photo ? (
              <img src={booking.trainer.photo} alt={booking.trainer.publicName} className="booking-trainer-img" />
            ) : (
              <div className="booking-trainer-img placeholder">👤</div>
            )}
            <div>
              <div className="info-label">Преподаватель / Тренер</div>
              <div className="booking-trainer-name">{booking.trainer.publicName}</div>
              {booking.trainer.city && <div className="info-sub">📍 {booking.trainer.city}</div>}
            </div>
          </div>

          <div className="booking-details-grid">
            <div className="grid-cell">
              <div className="info-label">Время проведения</div>
              <div className="info-value">{startFormatted} — {endFormatted}</div>
            </div>

            <div className="grid-cell">
              <div className="info-label">Место проведения</div>
              <div className="info-value">{booking.venue.title}</div>
              {booking.venue.address && <div className="info-sub">{booking.venue.address}</div>}
            </div>

            <div className="grid-cell">
              <div className="info-label">Стоимость</div>
              <div className="info-value">
                {booking.slot.price > 0
                  ? `${booking.slot.price.toLocaleString('ru-RU')} ${booking.slot.currency}`
                  : 'Бесплатно'}
              </div>
            </div>

            <div className="grid-cell">
              <div className="info-label">Номер бронирования</div>
              <div className="info-value code">{booking.id}</div>
            </div>
          </div>

          {cancelError && <div className="form-error-banner">{cancelError}</div>}

          {booking.canCancel && (
            <div className="booking-cancel-section">
              {!showConfirmCancel ? (
                <button
                  type="button"
                  className="button secondary danger"
                  onClick={() => setShowConfirmCancel(true)}
                >
                  Отменить запись на тренировку
                </button>
              ) : (
                <div className="cancel-confirm-box">
                  <p>Вы уверены, что хотите отменить эту тренировку? Место будет освобождено для других.</p>
                  <div className="confirm-buttons">
                    <button
                      type="button"
                      className="button danger"
                      disabled={cancelLoading}
                      onClick={() => void handleCancelBooking()}
                    >
                      {cancelLoading ? 'Отмена…' : 'Да, отменить запись'}
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      disabled={cancelLoading}
                      onClick={() => setShowConfirmCancel(false)}
                    >
                      Не отменять
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
