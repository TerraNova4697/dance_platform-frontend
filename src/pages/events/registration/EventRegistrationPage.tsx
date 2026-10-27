import { useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getEventDetails, getMasterClassSlots } from '../../../services/eventDetails'
import { initiateMasterClassBooking, type InitiateBookingResult, type ConfirmPaymentResult } from '../../../api/booking'
import { BookingHoldModal } from '../../../components/BookingHoldModal'
import { DashboardHeader } from '../../dashboard/components/DashboardHeader'
import { useAuth } from '../../../hooks/useAuth'
import { getDashboardProfile } from '../../../services/dashboard'
import './EventRegistrationPage.css'

export function EventRegistrationPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const preselectedSlotId = searchParams.get('slot') || ''
  const preselectedPackageId = searchParams.get('package') || ''

  const [userSelectedType, setUserSelectedType] = useState<'slot' | 'package' | null>(null)
  const [userSelectedSlot, setUserSelectedSlot] = useState<string>('')
  const [userSelectedPackage, setUserSelectedPackage] = useState<string>('')

  const selectedType = userSelectedType ?? (preselectedPackageId ? 'package' : 'slot')
  const selectedSlot = userSelectedSlot || preselectedSlotId
  const selectedPackage = userSelectedPackage || preselectedPackageId

  const [holdSession, setHoldSession] = useState<InitiateBookingResult | null>(null)
  const [holdTitle, setHoldTitle] = useState('')
  const [holdSubtitle, setHoldSubtitle] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user),
  })

  const eventQuery = useQuery({
    queryKey: ['event-details', eventId],
    queryFn: () => getEventDetails(eventId),
    enabled: Boolean(eventId),
  })

  const slotsQuery = useQuery({
    queryKey: ['master-class-slots', eventId],
    queryFn: () => getMasterClassSlots(eventId),
    enabled: Boolean(eventId && eventQuery.data?.type === 'master_class'),
  })

  const event = eventQuery.data
  const slots = slotsQuery.data || []
  const packages = event?.packages || []

  async function handleStartBooking() {
    if (!event || event.type !== 'master_class') return
    setBookingLoading(true)
    setBookingError(null)

    try {
      const isPkg = selectedType === 'package' && selectedPackage
      const slotId = !isPkg && selectedSlot ? selectedSlot : undefined
      const packageId = isPkg ? selectedPackage : undefined

      if (!slotId && !packageId) {
        setBookingError('Пожалуйста, выберите слот или пакет мастер-класса.')
        setBookingLoading(false)
        return
      }

      let title = event.title
      let subtitle = ''
      if (packageId) {
        const pkg = packages.find((p) => p.id === packageId)
        title = `${event.title} — ${pkg?.title || 'Пакет'}`
        subtitle = pkg?.description || 'Пакет мастер-класса'
      } else if (slotId) {
        const slot = slots.find((s) => s.id === slotId)
        title = `${event.title} — Слот`
        subtitle = slot ? `${new Date(slot.startAt).toLocaleString('ru-RU')} - ${new Date(slot.endAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : ''
      }

      const res = await initiateMasterClassBooking({
        masterClassId: event.id,
        slotId,
        packageId,
      })

      setHoldTitle(title)
      setHoldSubtitle(subtitle)
      setHoldSession(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось начать бронирование'
      setBookingError(msg)
    } finally {
      setBookingLoading(false)
    }
  }

  function handleBookingSuccess(result?: ConfirmPaymentResult) {
    setHoldSession(null)
    if (result?.ticket_id) {
      navigate(`/tickets/${encodeURIComponent(result.ticket_id)}`)
    } else {
      navigate('/tickets')
    }
  }

  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  if (eventQuery.isPending) {
    return (
      <div className="dashboard-page registration-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="registration-main">
          <div className="registration-card loading-card">Загрузка информации о записи…</div>
        </main>
      </div>
    )
  }

  if (eventQuery.isError || !event) {
    return (
      <div className="dashboard-page registration-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="registration-main">
          <div className="registration-card error-card">
            <h2>Ивент не найден</h2>
            <p>Не удалось загрузить параметры записи для данного мероприятия.</p>
            <Link to="/events" className="button primary">
              В каталог Ивентов
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (event.type === 'tournament') {
    return (
      <div className="dashboard-page registration-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="registration-main">
          <div className="registration-card stub-card">
            <span className="stub-icon">🏆</span>
            <h2>Регистрация на турнир</h2>
            <p className="stub-event-title">{event.title}</p>
            <div className="stub-notice">
              <strong>Внимание:</strong> Онлайн-подача заявок на турниры (выбор категорий участников и пар)
              будет доступна в следующих обновлениях. В текущем Sprint 1 полностью доступна запись на
              мастер-классы и тренировки.
            </div>
            <Link to={`/events/${encodeURIComponent(event.id)}`} className="button primary">
              ← Вернуться к описанию турнира
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-page registration-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="registration-main">
        <div className="registration-breadcrumbs">
          <Link to={`/events/${encodeURIComponent(event.id)}`}>← Назад к Ивенту</Link>
        </div>

        <div className="registration-card">
          <div className="registration-header">
            <span className="badge-type">Мастер-класс</span>
            <h1>Запись на {event.title}</h1>
            <p className="event-meta">
              📍 {event.venue?.name || event.venue?.city || 'Место уточняется'} · 📅{' '}
              {new Date(event.startAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {packages.length > 0 && (
            <div className="registration-type-selector">
              <button
                type="button"
                className={`type-tab ${selectedType === 'package' ? 'active' : ''}`}
                onClick={() => {
                  setUserSelectedType('package')
                  setSearchParams({ package: selectedPackage || packages[0].id })
                }}
              >
                Пакеты участия ({packages.length})
              </button>
              <button
                type="button"
                className={`type-tab ${selectedType === 'slot' ? 'active' : ''}`}
                onClick={() => {
                  setUserSelectedType('slot')
                  setSearchParams({ slot: selectedSlot || (slots[0]?.id || '') })
                }}
              >
                Отдельные слоты ({slots.length})
              </button>
            </div>
          )}

          {selectedType === 'package' && packages.length > 0 ? (
            <div className="package-options-list">
              {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.id
                return (
                  <label
                    key={pkg.id}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setUserSelectedPackage(pkg.id)
                      setSearchParams({ package: pkg.id })
                    }}
                  >
                    <div className="option-radio">
                      <input
                        type="radio"
                        name="package_selection"
                        checked={isSelected}
                        onChange={() => {
                          setUserSelectedPackage(pkg.id)
                          setSearchParams({ package: pkg.id })
                        }}
                      />
                    </div>
                    <div className="option-info">
                      <div className="option-title">{pkg.title}</div>
                      {pkg.description && <div className="option-desc">{pkg.description}</div>}
                    </div>
                    <div className="option-price">
                      {pkg.price ? `${pkg.price.toLocaleString('ru-RU')} ${pkg.currency || 'KZT'}` : 'Бесплатно'}
                    </div>
                  </label>
                )
              })}
            </div>
          ) : (
            <div className="slot-options-list">
              {slotsQuery.isPending ? (
                <div className="loading-state">Загрузка доступных слотов…</div>
              ) : slots.length === 0 ? (
                <div className="empty-state">Нет доступных слотов для записи.</div>
              ) : (
                slots.map((slot) => {
                  const isSelected = selectedSlot === slot.id
                  const isFull = slot.availabilityStatus === 'full' || (slot.availablePlaces !== undefined && slot.availablePlaces !== null && slot.availablePlaces <= 0)
                  return (
                    <label
                      key={slot.id}
                      className={`option-card ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}`}
                      onClick={() => {
                        if (isFull) return
                        setUserSelectedSlot(slot.id)
                        setSearchParams({ slot: slot.id })
                      }}
                    >
                      <div className="option-radio">
                        <input
                          type="radio"
                          name="slot_selection"
                          checked={isSelected}
                          disabled={isFull}
                          onChange={() => {
                            if (isFull) return
                            setUserSelectedSlot(slot.id)
                            setSearchParams({ slot: slot.id })
                          }}
                        />
                      </div>
                      <div className="option-info">
                        <div className="option-title">
                          {new Date(slot.startAt).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' — '}
                          {new Date(slot.endAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="option-places">
                          {isFull ? (
                            <span className="badge-full">Мест нет</span>
                          ) : slot.availablePlaces !== null ? (
                            <span className="badge-avail">Осталось мест: {slot.availablePlaces}</span>
                          ) : (
                            <span className="badge-avail">Места есть</span>
                          )}
                        </div>
                      </div>
                      <div className="option-price">
                        {slot.price ? `${slot.price.toLocaleString('ru-RU')} ${slot.currency}` : 'Бесплатно'}
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          )}

          {bookingError && <div className="form-error-banner">{bookingError}</div>}

          <div className="registration-action-box">
            <div className="action-hint">
              🔒 При нажатии на кнопку место бронируется за вами на 15 минут.
            </div>
            <button
              type="button"
              className="button primary large"
              disabled={bookingLoading || (selectedType === 'slot' && !selectedSlot) || (selectedType === 'package' && !selectedPackage)}
              onClick={() => void handleStartBooking()}
            >
              {bookingLoading ? 'Бронирование места…' : 'Забронировать место и перейти к подтверждению'}
            </button>
          </div>
        </div>
      </main>

      {holdSession && (
        <BookingHoldModal
          session={holdSession}
          title={holdTitle}
          subtitle={holdSubtitle}
          onSuccess={handleBookingSuccess}
          onClose={() => setHoldSession(null)}
        />
      )}
    </div>
  )
}
