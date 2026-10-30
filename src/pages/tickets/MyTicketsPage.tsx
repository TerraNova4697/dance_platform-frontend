import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getMyTickets, type TicketSummary } from '../../api/tickets'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardProfile } from '../../services/dashboard'
import './tickets.css'

export function MyTicketsPage() {
  const { user, logout } = useAuth()
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active')

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user),
  })

  const ticketsQuery = useQuery({
    queryKey: ['my-tickets', filter],
    queryFn: () => getMyTickets(filter === 'all' ? undefined : filter),
  })

  const tickets = ticketsQuery.data || []
  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  return (
    <div className="dashboard-page tickets-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="tickets-main">
        <div className="tickets-header-row">
          <div>
            <h1>Мои QR-билеты</h1>
            <p className="tickets-subtitle">
              Предъявляйте цифровой билет с QR-кодом контролеру на входе в зал
            </p>
          </div>

          <div className="tickets-filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Активные
            </button>
            <button
              type="button"
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все
            </button>
          </div>
        </div>

        {ticketsQuery.isPending ? (
          <div className="tickets-loading">Загрузка билетов…</div>
        ) : tickets.length === 0 ? (
          <div className="tickets-empty-state">
            <span className="empty-icon">🎟️</span>
            <h3>У вас пока нет {filter === 'active' ? 'активных' : ''} билетов</h3>
            <p>Запишитесь на тренировку или мастер-класс, и билеты появятся здесь.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
              <Link to="/trainers" className="button primary">
                Выбрать тренера
              </Link>
              <Link to="/events" className="button secondary">
                Смотреть события
              </Link>
            </div>
          </div>
        ) : (
          <div className="tickets-grid">
            {tickets.map((t: TicketSummary) => {
              const startAt = t.event.startAt ? new Date(t.event.startAt) : null
              const hasValidDate = startAt && !isNaN(startAt.getTime())
              const dateStr = hasValidDate
                ? startAt.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Дата уточняется'
              const timeStr = hasValidDate
                ? startAt.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''

              return (
                <div key={t.id} className={`ticket-card status-${t.status}`}>
                  <div className="ticket-card-header">
                    <span className="ticket-badge-number">{t.ticketNumber}</span>
                    <span className={`ticket-badge-status ${t.isCheckedIn ? 'checked-in' : t.status}`}>
                      {t.isCheckedIn ? 'Проход выполнен' : t.status === 'active' ? 'Действителен' : t.status}
                    </span>
                  </div>

                  <div className="ticket-card-body">
                    <h3 className="ticket-event-title">{t.event.title}</h3>
                    <div className="ticket-item-title">{t.itemTitle}</div>

                    <div className="ticket-details-meta">
                      <div className="meta-line">
                        <span className="meta-icon">📅</span>
                        <span>{dateStr} в {timeStr}</span>
                      </div>
                      <div className="meta-line">
                        <span className="meta-icon">📍</span>
                        <span>{t.event.venueName || t.event.city || 'Место уточняется'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ticket-card-footer">
                    <Link to={`/tickets/${encodeURIComponent(t.id)}`} className="button primary full-width">
                      Открыть QR-билет
                    </Link>
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

