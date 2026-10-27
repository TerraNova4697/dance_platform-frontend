import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getPublicTrainers, type PublicTrainerSummary } from '../../api/trainers'
import { getAvailableTrainingSlots, initiateTrainingBooking, type AvailableTrainingSlot, type InitiateBookingResult } from '../../api/booking'
import { BookingHoldModal } from '../../components/BookingHoldModal'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardProfile } from '../../services/dashboard'
import './trainers.css'

export function TrainersCatalogPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'slots' | 'trainers'>('slots')
  const [cityFilter, setCityFilter] = useState('')
  const [queryFilter, setQueryFilter] = useState('')
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('')

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

  const slotsQuery = useQuery({
    queryKey: ['training-slots', cityFilter],
    queryFn: () => getAvailableTrainingSlots({ city: cityFilter || undefined }),
    enabled: activeTab === 'slots',
  })

  const trainersQuery = useQuery({
    queryKey: ['public-trainers', cityFilter, queryFilter],
    queryFn: () => getPublicTrainers({ city: cityFilter || undefined, query: queryFilter || undefined }),
    enabled: activeTab === 'trainers',
  })

  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  async function handleBookSlot(slot: AvailableTrainingSlot) {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/trainers')}`)
      return
    }

    setBookingLoading(true)
    setBookingError(null)

    try {
      const res = await initiateTrainingBooking(slot.id)
      setHoldTitle(`${slot.offering_title} — ${slot.trainer_name}`)
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

  return (
    <div className="dashboard-page trainers-catalog-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="trainers-main">
        <div className="trainers-header">
          <div>
            <h1>Тренировки и Тренеры</h1>
            <p className="trainers-subtitle">
              Записывайтесь на индивидуальные и групповые тренировки к опытным преподавателям
            </p>
          </div>

          <div className="catalog-tab-switch">
            <button
              type="button"
              className={`catalog-tab ${activeTab === 'slots' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('slots')
                setSelectedOfferingId(null)
              }}
            >
              Тренировки
            </button>
            <button
              type="button"
              className={`catalog-tab ${activeTab === 'trainers' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('trainers')
                setSelectedOfferingId(null)
              }}
            >
              Каталог тренеров
            </button>
          </div>
        </div>

        <div className="trainers-filters-row">
          <input
            type="text"
            className="filter-input search"
            placeholder={activeTab === 'slots' ? 'Поиск по расписанию…' : 'Поиск тренера по имени…'}
            value={queryFilter}
            onChange={(e) => setQueryFilter(e.target.value)}
          />
          <input
            type="text"
            className="filter-input city"
            placeholder="Город (например, Алматы)"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
        </div>

        {bookingError && <div className="form-error-banner">{bookingError}</div>}

        {activeTab === 'slots' ? (
          <div className="slots-section">
            {slotsQuery.isPending ? (
              <div className="trainers-loading">Загрузка доступных тренировок…</div>
            ) : (slotsQuery.data || []).length === 0 ? (
              <div className="trainers-empty-state">
                <span className="empty-icon">👟</span>
                <h3>Нет доступных тренировок</h3>
                <p>Попробуйте изменить фильтр города или посмотрите каталог тренеров.</p>
              </div>
            ) : (() => {
              const allSlots: AvailableTrainingSlot[] = slotsQuery.data || []

              // Filter by query (title or trainer)
              const filteredByQuery = allSlots.filter((s) => {
                if (!queryFilter) return true
                const q = queryFilter.toLowerCase()
                return s.offering_title.toLowerCase().includes(q) || s.trainer_name.toLowerCase().includes(q)
              })

              // If an offering is selected, show its available dates and times for booking
              if (selectedOfferingId) {
                const offeringSlots = filteredByQuery.filter((s) => s.training_offering === selectedOfferingId)
                const firstSlot = offeringSlots[0] || allSlots.find((s) => s.training_offering === selectedOfferingId)

                const slotsAfterDate = selectedDateFilter
                  ? offeringSlots.filter((s) => s.start_datetime.startsWith(selectedDateFilter))
                  : offeringSlots

                // Group by date
                const grouped: Record<string, AvailableTrainingSlot[]> = {}
                for (const sl of slotsAfterDate) {
                  const dKey = sl.start_datetime.slice(0, 10)
                  if (!grouped[dKey]) grouped[dKey] = []
                  grouped[dKey].push(sl)
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => {
                          setSelectedOfferingId(null)
                          setSelectedDateFilter('')
                        }}
                      >
                        ← Ко всем тренировкам
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#4b5563' }}>Фильтр по дате:</span>
                        <input
                          type="date"
                          value={selectedDateFilter}
                          onChange={(e) => setSelectedDateFilter(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                        />
                        {selectedDateFilter && (
                          <button
                            type="button"
                            className="button"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => setSelectedDateFilter('')}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {firstSlot && (
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: firstSlot.training_type === 'Individual' ? '#eff6ff' : '#f0fdf4', color: firstSlot.training_type === 'Individual' ? '#1d4ed8' : '#15803d', display: 'inline-block', marginBottom: '6px' }}>
                            {firstSlot.training_type === 'Individual' ? 'Индивидуальная тренировка' : 'Групповая тренировка'}
                          </span>
                          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>{firstSlot.offering_title}</h2>
                          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                            Преподаватель: <strong>{firstSlot.trainer_name}</strong> {firstSlot.direction_title && `· ${firstSlot.direction_title}`}
                          </div>
                          {firstSlot.schedule_type === 'Recurring' && (
                            <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                              📦 Регулярные занятия — оплата абонементом на {firstSlot.package_size || 8} тренировок
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                            {firstSlot.schedule_type === 'Recurring' && firstSlot.package_price
                              ? `${Number(firstSlot.package_price).toLocaleString()} ${firstSlot.currency}`
                              : firstSlot.price > 0 ? `${firstSlot.price.toLocaleString()} ${firstSlot.currency}` : 'Бесплатно'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {firstSlot.schedule_type === 'Recurring' ? `за абонемент (${firstSlot.package_size} зан.)` : 'за занятие'}
                          </span>
                        </div>
                      </div>
                    )}

                    <h3 style={{ margin: '8px 0 0', fontSize: '1.1rem' }}>Выберите дату и время для записи:</h3>

                    {Object.keys(grouped).length === 0 ? (
                      <div className="trainers-empty-state">
                        <span className="empty-icon">📅</span>
                        <h3>Нет свободных слотов на выбранную дату</h3>
                        <p>Попробуйте выбрать другую дату для тренировки.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {Object.entries(grouped).map(([dKey, dSlots]) => {
                          const dateObj = new Date(dKey)
                          const formattedDateHeader = dateObj.toLocaleDateString('ru-RU', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })
                          const capitalizedHeader = formattedDateHeader.charAt(0).toUpperCase() + formattedDateHeader.slice(1)

                          return (
                            <div key={dKey} style={{ background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                <span>🗓</span>
                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{capitalizedHeader}</h4>
                                <span style={{ fontSize: '0.8rem', color: '#6366f1', background: '#e0e7ff', padding: '1px 6px', borderRadius: '10px' }}>
                                  {dSlots.length} {dSlots.length === 1 ? 'время' : 'варианта'}
                                </span>
                              </div>

                              <div className="slots-grid">
                                {dSlots.map((slot) => {
                                  const startStr = new Date(slot.start_datetime).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                  const endStr = new Date(slot.end_datetime).toLocaleTimeString('ru-RU', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })

                                  return (
                                    <div key={slot.id} className="training-slot-card" style={{ border: '1px solid #e2e8f0' }}>
                                      <div className="slot-meta-box">
                                        <div className="meta-row">
                                          <span className="meta-icon">⏰</span>
                                          <strong style={{ fontSize: '1.05rem', color: '#4338ca' }}>{startStr} — {endStr}</strong>
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
                                          disabled={slot.is_full || bookingLoading}
                                          onClick={() => void handleBookSlot(slot)}
                                        >
                                          {slot.is_full ? 'Мест нет' : slot.schedule_type === 'Recurring' ? 'Записаться на курс' : 'Записаться на это время'}
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
                    )}
                  </div>
                )
              }

              // Default view: Group slots into distinct Training Offerings (Programs)
              const offeringsMap = new Map<string, { offering: AvailableTrainingSlot; slotsCount: number; upcomingCount: number }>()
              for (const sl of filteredByQuery) {
                const offId = sl.training_offering
                if (!offeringsMap.has(offId)) {
                  offeringsMap.set(offId, { offering: sl, slotsCount: 1, upcomingCount: 1 })
                } else {
                  const curr = offeringsMap.get(offId)!
                  curr.slotsCount += 1
                  curr.upcomingCount += 1
                }
              }

              const distinctOfferings = Array.from(offeringsMap.values())

              return (
                <div className="slots-grid">
                  {distinctOfferings.map(({ offering, slotsCount }) => (
                    <div key={offering.training_offering} className="training-slot-card">
                      <div className="slot-card-top">
                        <span className="slot-type-badge">
                          {offering.training_type === 'Individual' ? 'Индивидуальная' : 'Групповая'}
                        </span>
                        <span className="slot-price">
                          {offering.schedule_type === 'Recurring' && offering.package_price ? (
                            <span>{Number(offering.package_price).toLocaleString('ru-RU')} {offering.currency} <small style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ абонемент</small></span>
                          ) : offering.price > 0 ? (
                            `${offering.price.toLocaleString('ru-RU')} ${offering.currency}`
                          ) : (
                            'Бесплатно'
                          )}
                        </span>
                      </div>

                      <h3 className="slot-title">{offering.offering_title}</h3>

                      <div className="slot-trainer-row">
                        {offering.trainer_photo ? (
                          <img src={offering.trainer_photo} alt={offering.trainer_name} className="slot-trainer-avatar" />
                        ) : (
                          <div className="slot-trainer-avatar placeholder">👤</div>
                        )}
                        <div>
                          <div className="slot-trainer-name">{offering.trainer_name}</div>
                          {offering.direction_title && (
                            <div className="slot-trainer-dir">{offering.direction_title}</div>
                          )}
                        </div>
                      </div>

                      <div className="slot-meta-box">
                        <div className="meta-row">
                          <span className="meta-icon">📍</span>
                          <span>{offering.venue_title || offering.venue_city || 'Зал уточняется'}</span>
                        </div>
                        <div className="meta-row">
                          <span className="meta-icon">🗓</span>
                          <span>Доступно слотов для записи: <strong>{slotsCount}</strong></span>
                        </div>
                        {offering.schedule_type === 'Recurring' && (
                          <div className="meta-row" style={{ color: '#92400e', fontWeight: 500 }}>
                            <span className="meta-icon">📦</span>
                            <span>Курс на {offering.package_size || 8} тренировок</span>
                          </div>
                        )}
                      </div>

                      <div className="slot-card-action">
                        <button
                          type="button"
                          className="button primary full-width"
                          onClick={() => setSelectedOfferingId(offering.training_offering)}
                        >
                          Выбрать дату и время →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        ) : (
          <div className="trainers-section">
            {trainersQuery.isPending ? (
              <div className="trainers-loading">Загрузка каталога тренеров…</div>
            ) : (trainersQuery.data || []).length === 0 ? (
              <div className="trainers-empty-state">
                <span className="empty-icon">👟</span>
                <h3>Тренеры не найдены</h3>
                <p>Попробуйте сбросить фильтры поиска.</p>
              </div>
            ) : (
              <div className="trainers-grid">
                {(trainersQuery.data || []).map((t: PublicTrainerSummary) => (
                  <div key={t.id} className="trainer-card">
                    <div className="trainer-card-header">
                      {t.photo ? (
                        <img src={t.photo} alt={t.public_name} className="trainer-avatar-large" />
                      ) : (
                        <div className="trainer-avatar-large placeholder">👤</div>
                      )}
                      <div>
                        <h3 className="trainer-name">{t.public_name}</h3>
                        <div className="trainer-city">📍 {t.city || 'Казахстан'}</div>
                      </div>
                    </div>

                    {t.bio && <p className="trainer-bio-preview">{t.bio}</p>}

                    {t.directions && t.directions.length > 0 && (
                      <div className="trainer-directions-chips">
                        {t.directions.map((dir, i) => (
                          <span key={i} className="dir-chip">
                            {dir}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="trainer-card-footer">
                      <Link to={`/trainers/${encodeURIComponent(t.id)}`} className="button secondary full-width">
                        Профиль и тренировки
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {holdSession && (
        <BookingHoldModal
          session={holdSession}
          title={holdTitle}
          subtitle={holdSubtitle}
          onSuccess={() => {
            setHoldSession(null)
            navigate('/')
          }}
          onClose={() => setHoldSession(null)}
        />
      )}
    </div>
  )
}

