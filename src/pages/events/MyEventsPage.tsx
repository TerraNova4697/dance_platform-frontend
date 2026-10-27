import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getAllMyEvents, getDashboardProfile } from '../../services/dashboard'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { useAuth } from '../../hooks/useAuth'
import type { RegisteredEventPreview } from '../../types/dashboard'
import './my-events.css'

export function MyEventsPage() {
  const { user, logout } = useAuth()
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all')

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user),
  })

  const eventsQuery = useQuery({
    queryKey: ['my-all-events', user],
    queryFn: () => getAllMyEvents(user ?? ''),
    enabled: Boolean(user),
  })

  const allEvents = eventsQuery.data || []
  const filteredEvents = allEvents.filter((e: RegisteredEventPreview) => {
    if (filter === 'confirmed') return e.registrationStatus === 'confirmed'
    if (filter === 'pending') return e.registrationStatus === 'pending_payment'
    return true
  })

  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  return (
    <div className="dashboard-page my-events-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="my-events-main">
        <div className="my-events-header">
          <div>
            <h1>Мои Ивенты</h1>
            <p className="my-events-subtitle">
              Мастер-классы и мероприятия, на которые вы зарегистрированы
            </p>
          </div>

          <div className="events-filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все ({allEvents.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
              onClick={() => setFilter('confirmed')}
            >
              Подтвержденные
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Ожидают оплаты
            </button>
          </div>
        </div>

        {eventsQuery.isPending ? (
          <div className="events-loading">Загрузка ваших событий…</div>
        ) : filteredEvents.length === 0 ? (
          <div className="events-empty-state">
            <span className="empty-icon">🎪</span>
            <h3>События не найдены</h3>
            <p>Вы пока не записаны на мероприятия в этом разделе.</p>
            <Link to="/events" className="button primary">
              Смотреть афишу событий
            </Link>
          </div>
        ) : (
          <div className="my-events-grid">
            {filteredEvents.map((evt: RegisteredEventPreview) => {
              const startFormatted = new Date(evt.startAt).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div key={evt.id} className="my-event-card">
                  {evt.coverUrl && (
                    <div className="event-card-cover-wrapper">
                      <img src={evt.coverUrl} alt={evt.title} className="event-card-cover" />
                    </div>
                  )}

                  <div className="event-card-content">
                    <div className="event-card-top-meta">
                      <span className="badge-event-type">
                        {evt.type === 'master_class' ? 'Мастер-класс' : 'Турнир'}
                      </span>
                      <span className={`badge-reg-status ${evt.registrationStatus}`}>
                        {evt.registrationStatus === 'confirmed'
                          ? 'Подтверждено'
                          : evt.registrationStatus === 'pending_payment'
                          ? 'Ожидает оплаты'
                          : evt.registrationStatus}
                      </span>
                    </div>

                    <h3 className="my-event-title">{evt.title}</h3>

                    <div className="my-event-meta-lines">
                      <div className="meta-line">
                        <span className="meta-icon">📅</span>
                        <span>{startFormatted}</span>
                      </div>
                      <div className="meta-line">
                        <span className="meta-icon">📍</span>
                        <span>{evt.venueName || evt.city || 'Место уточняется'}</span>
                      </div>
                    </div>

                    {evt.entries && evt.entries.length > 0 && (
                      <div className="my-event-entries-box">
                        <span className="entries-label">Заявка:</span>
                        {evt.entries.map((entry) => (
                          <span key={entry.id} className="entry-tag">
                            {entry.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="my-event-card-actions">
                      {evt.ticketId ? (
                        <Link to={`/tickets/${encodeURIComponent(evt.ticketId)}`} className="button primary">
                          Открыть QR-билет
                        </Link>
                      ) : (
                        <Link to={`/events/${encodeURIComponent(evt.id)}`} className="button primary">
                          Детали мероприятия
                        </Link>
                      )}
                      <Link to={`/events/${encodeURIComponent(evt.id)}`} className="button secondary">
                        О событии
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

