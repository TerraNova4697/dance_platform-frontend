import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getTicketDetails } from '../../api/tickets'
import { QRCodeCanvas } from '../../components/QRCodeCanvas'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardProfile } from '../../services/dashboard'
import './tickets.css'

export function TicketDetailsPage() {
  const { ticketId = '' } = useParams<{ ticketId: string }>()
  const { user, logout } = useAuth()

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', user],
    queryFn: () => getDashboardProfile(user ?? ''),
    enabled: Boolean(user),
  })

  const ticketQuery = useQuery({
    queryKey: ['ticket-details', ticketId],
    queryFn: () => getTicketDetails(ticketId),
    enabled: Boolean(ticketId),
  })

  const ticket = ticketQuery.data
  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Танцор'

  if (ticketQuery.isPending) {
    return (
      <div className="dashboard-page tickets-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="tickets-main">
          <div className="ticket-view-card loading">Загрузка билета…</div>
        </main>
      </div>
    )
  }

  if (ticketQuery.isError || !ticket) {
    return (
      <div className="dashboard-page tickets-page">
        <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
        <main className="tickets-main">
          <div className="ticket-view-card error">
            <h2>Билет не найден</h2>
            <p>Не удалось найти указанный билет или у вас нет к нему доступа.</p>
            <Link to="/tickets" className="button primary">
              Вернуться к моим билетам
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const startFormatted = new Date(ticket.event.startAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="dashboard-page tickets-page">
      <DashboardHeader firstName={firstName} onLogout={() => void logout()} />
      <main className="tickets-main single-ticket-main">
        <div className="ticket-top-nav">
          <Link to="/tickets" className="back-link">
            ← Все мои билеты
          </Link>
          <button
            type="button"
            className="button secondary print-button"
            onClick={() => window.print()}
          >
            🖨️ Распечатать / Сохранить
          </button>
        </div>

        <div className="ticket-pass-card printable-ticket">
          <div className="pass-header">
            <div className="pass-host-label">{ticket.event.hostName || 'Dance Platform'}</div>
            <h1 className="pass-event-title">{ticket.event.title}</h1>
            <div className="pass-type-badge">{ticket.ticketType}</div>
          </div>

          <div className="pass-qr-container">
            <div className="qr-wrapper">
              <QRCodeCanvas value={ticket.qrUrl} size={220} />
            </div>
            <div className="pass-ticket-number">{ticket.ticketNumber}</div>
            <div className={`pass-status-pill ${ticket.isCheckedIn ? 'checked-in' : ticket.status}`}>
              {ticket.isCheckedIn ? '✓ Вход выполнен' : '● Действителен на входе'}
            </div>
            {ticket.checkedInAt && (
              <div className="pass-checkin-time">
                Отметка о проходе: {new Date(ticket.checkedInAt).toLocaleString('ru-RU')}
              </div>
            )}
          </div>

          <div className="pass-divider">
            <span className="notch-left" />
            <span className="dash-line" />
            <span className="notch-right" />
          </div>

          <div className="pass-body">
            <div className="pass-participant-row">
              {ticket.person.photo ? (
                <img src={ticket.person.photo} alt={ticket.person.fullName} className="participant-photo" />
              ) : (
                <div className="participant-photo placeholder">👤</div>
              )}
              <div className="participant-info">
                <div className="info-label">Участник</div>
                <div className="info-value">{ticket.person.fullName || user}</div>
                {ticket.person.email && <div className="info-sub">{ticket.person.email}</div>}
              </div>
            </div>

            <div className="pass-grid">
              <div className="grid-cell">
                <div className="info-label">Дата и время начала</div>
                <div className="info-value">{startFormatted}</div>
              </div>
              <div className="grid-cell">
                <div className="info-label">Место проведения</div>
                <div className="info-value">{ticket.event.venueName || ticket.event.city || 'Место уточняется'}</div>
                {ticket.event.venueAddress && <div className="info-sub">{ticket.event.venueAddress}</div>}
              </div>
            </div>

            {ticket.package && (
              <div className="pass-included-section">
                <div className="info-label">Пакет участия</div>
                <div className="included-title">{ticket.package.title}</div>
                {ticket.package.description && (
                  <div className="included-desc">{ticket.package.description}</div>
                )}
              </div>
            )}

            {ticket.slots && ticket.slots.length > 0 && (
              <div className="pass-included-section">
                <div className="info-label">Включенные мастер-классы ({ticket.slots.length})</div>
                <div className="pass-slots-list">
                  {ticket.slots.map((s) => (
                    <div key={s.id} className="pass-slot-item">
                      ⏱ {new Date(s.startAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' — '}
                      {new Date(s.endAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pass-footer">
            <p>Предъявите этот QR-код на экране смартфона или в распечатанном виде при входе.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

