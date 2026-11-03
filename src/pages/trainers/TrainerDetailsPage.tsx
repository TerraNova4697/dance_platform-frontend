import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicTrainerDetails } from '../../api/trainers'
import {
  initiateTrainingBooking,
  type AvailableTrainingSlot,
  type InitiateBookingResult,
  type BookingConflictItem,
} from '../../api/booking'
import { BookingHoldModal } from '../../components/BookingHoldModal'
import { TimeConflictWarningModal } from '../../components/TimeConflictWarningModal'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardProfile } from '../../services/dashboard'
import './trainers.css'

export function TrainerDetailsPage() {
  const { trainerId = '' } = useParams<{ trainerId: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [holdSession, setHoldSession] = useState<InitiateBookingResult | null>(null)
  const [holdTitle, setHoldTitle] = useState('')
  const [holdSubtitle, setHoldSubtitle] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [conflictWarning, setConflictWarning] = useState<{
    conflicts: BookingConflictItem[]
    message?: string
    onConfirm: () => void
  } | null>(null)

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user),
  })

  const trainerQuery = useQuery({
    queryKey: ['trainer-details', trainerId],
    queryFn: () => getPublicTrainerDetails(trainerId),
    enabled: Boolean(trainerId),
  })

  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('all')

  const trainer = trainerQuery.data
  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  async function handleBookSlot(slot: AvailableTrainingSlot, ignoreConflict = false) {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/trainers/${trainerId}`)}`)
      return
    }
    if (slot.is_already_booked) {
      setBookingError('Вы уже записаны на эту тренировку.')
      return
    }

    setBookingLoading(true)
    setBookingError(null)

    try {
      const res = await initiateTrainingBooking(slot.id, ignoreConflict)
      if (res.warning_required && res.conflicts?.length) {
        setConflictWarning({
          conflicts: res.conflicts,
          message: res.message,
          onConfirm: () => {
            setConflictWarning(null)
            void handleBookSlot(slot, true)
          },
        })
        return
      }
      setHoldTitle(`${slot.offering_title} — ${trainer?.publicName}`)
      setHoldSubtitle(
        `${new Date(slot.start_datetime).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })} · ${slot.venue_title || 'Зал'}`
      )
      setHoldSession(res)
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : 'Не удалось начать бронирование')
    } finally {
      setBookingLoading(false)
    }
  }

  if (trainerQuery.isPending) {
    return (
      <div className="dashboard-page trainers-catalog-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="trainers-main">
          <div className="trainers-loading">Загрузка профиля тренера…</div>
        </main>
      </div>
    )
  }

  if (trainerQuery.isError || !trainer) {
    return (
      <div className="dashboard-page trainers-catalog-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="trainers-main">
          <div className="trainers-empty-state">
            <h3>Тренер не найден</h3>
            <p>Возможно, профиль был удален или ссылка недействительна.</p>
            <Link to="/trainers" className="button primary">
              В каталог тренеров
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-page trainers-catalog-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="trainers-main">
        <div className="trainer-back-link">
          <Link to="/trainers">← Назад к каталогу</Link>
        </div>

        <div className="trainer-profile-hero">
          <div className="hero-avatar-box">
            {trainer.photo ? (
              <img src={trainer.photo} alt={trainer.publicName} className="hero-avatar" />
            ) : (
              <div className="hero-avatar placeholder">👤</div>
            )}
          </div>
          <div className="hero-info">
            <div className="hero-badges">
              {trainer.verificationStatus === 'Verified' && (
                <span className="badge-verified">✓ Верифицированный тренер</span>
              )}
              {trainer.city && <span className="badge-city">📍 {trainer.city}</span>}
            </div>
            <h1 className="hero-name">{trainer.publicName}</h1>
            {trainer.bio && <p className="hero-bio">{trainer.bio}</p>}

            {trainer.directions.length > 0 && (
              <div className="hero-directions">
                {trainer.directions.map((d, i) => (
                  <span key={i} className="dir-tag">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {bookingError && <div className="form-error-banner">{bookingError}</div>}

        <div className="trainer-slots-section">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Ближайшие тренировки ({trainer.slots.length})</h2>

            {trainer.slots.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>📅 Дата:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Формат:</span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                  >
                    <option value="all">Все</option>
                    <option value="Individual">Индивидуальные</option>
                    <option value="Group">Групповые</option>
                  </select>
                </label>

                {(selectedDate || selectedType !== 'all') && (
                  <button
                    type="button"
                    className="button"
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                    onClick={() => {
                      setSelectedDate('')
                      setSelectedType('all')
                    }}
                  >
                    ✕ Сброс
                  </button>
                )}
              </div>
            )}
          </div>

          {trainer.slots.length === 0 ? (
            <div className="no-slots-box">
              <p>У тренера пока нет открытых слотов для записи. Загляните позже!</p>
            </div>
          ) : (() => {
            const filtered = trainer.slots.filter((slot) => {
              if (selectedDate && !slot.start_datetime.startsWith(selectedDate)) return false
              if (selectedType !== 'all' && slot.training_type !== selectedType) return false
              return true
            })

            if (filtered.length === 0) {
              return (
                <div className="no-slots-box">
                  <p>На выбранную дату или формат нет свободных слотов. Попробуйте выбрать другую дату.</p>
                </div>
              )
            }

            // Group by date
            const grouped: Record<string, AvailableTrainingSlot[]> = {}
            for (const sl of filtered) {
              const dateKey = sl.start_datetime.slice(0, 10)
              if (!grouped[dateKey]) grouped[dateKey] = []
              grouped[dateKey].push(sl)
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.entries(grouped).map(([dateStr, slotsOnDate]) => {
                  const dateObj = new Date(dateStr)
                  const formattedDateHeader = dateObj.toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                  const capitalizedDateHeader = formattedDateHeader.charAt(0).toUpperCase() + formattedDateHeader.slice(1)

                  return (
                    <div key={dateStr} className="date-group-block">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border-default)', paddingBottom: '4px' }}>
                        <span style={{ fontSize: '1.1rem' }}>🗓</span>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {capitalizedDateHeader}
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--brand-accent)', background: 'rgba(212, 175, 140, 0.14)', border: '1px solid rgba(212, 175, 140, 0.28)', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>
                          {slotsOnDate.length}
                        </span>
                      </div>

                      <div className="slots-grid">
                        {slotsOnDate.map((slot) => {
                          const startStr = new Date(slot.start_datetime).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          const endStr = new Date(slot.end_datetime).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })

                          return (
                            <div key={slot.id} className="training-slot-card">
                              <div className="slot-card-top">
                                <span className="slot-type-badge">
                                  {slot.training_type === 'Individual' ? 'Индивидуальная' : 'Групповая'}
                                </span>
                                <span className="slot-price">
                                  {slot.price > 0 ? `${slot.price.toLocaleString('ru-RU')} ${slot.currency}` : 'Бесплатно'}
                                </span>
                              </div>

                              <h3 className="slot-title">{slot.offering_title}</h3>

                              <div className="slot-meta-box">
                                <div className="meta-row">
                                  <span className="meta-icon">⏰</span>
                                  <strong style={{ color: 'var(--text-primary, #09090b)' }}>{startStr} — {endStr}</strong>
                                </div>
                                <div className="meta-row">
                                  <span className="meta-icon">📍</span>
                                  <span>{slot.venue_title || slot.venue_city || 'Зал уточняется'}</span>
                                </div>
                                {slot.available_places !== null && (
                                  <div className="meta-row">
                                    <span className="meta-icon">👥</span>
                                    <span>Осталось мест: {slot.available_places}</span>
                                  </div>
                                )}
                              </div>

                              <div className="slot-card-action">
                                <button
                                  type="button"
                                  className="button primary full-width"
                                  disabled={slot.is_full || Boolean(slot.is_already_booked) || bookingLoading}
                                  onClick={() => void handleBookSlot(slot)}
                                >
                                  {slot.is_already_booked ? 'Вы уже записаны ✓' : slot.is_full ? 'Мест нет' : 'Записаться'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </main>

      {conflictWarning && (
        <TimeConflictWarningModal
          conflicts={conflictWarning.conflicts}
          message={conflictWarning.message}
          loading={bookingLoading}
          onCancel={() => setConflictWarning(null)}
          onConfirm={conflictWarning.onConfirm}
        />
      )}

      {holdSession && (
        <BookingHoldModal
          session={holdSession}
          title={holdTitle}
          subtitle={holdSubtitle}
          onSuccess={(result) => {
            setHoldSession(null)
            void trainerQuery.refetch()
            if (result?.ticket_id) {
              navigate(`/tickets/${encodeURIComponent(result.ticket_id)}`)
            } else {
              navigate('/tickets')
            }
          }}
          onClose={() => {
            setHoldSession(null)
            void trainerQuery.refetch()
          }}
        />
      )}
    </div>
  )
}

