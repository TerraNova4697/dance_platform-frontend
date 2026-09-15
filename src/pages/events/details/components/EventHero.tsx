import { Link } from 'react-router-dom'
import type { EventDetails } from '../../../../types/eventDetails'
import { formatCurrency } from '../../../../utils/currency'
import { Icon } from '../../../dashboard/components/Icons'
import { formatEventDate, formatEventTime } from '../format'

const registrationLabels = {
  not_open: 'Регистрация ещё не открыта',
  open: 'Регистрация открыта',
  closed: 'Регистрация закрыта',
  unknown: 'Статус регистрации уточняется',
} as const

export function EventHero({ event }: { event: EventDetails }) {
  return (
    <section className="event-details-hero">
      <div className="event-details-cover">
        {event.coverUrl ? <img src={event.coverUrl} alt={`Обложка Ивента «${event.title}»`} /> : <span>Dance Platform</span>}
      </div>
      <div className="event-hero-copy">
        <span className={`type-badge type-${event.type}`}>{event.type === 'tournament' ? 'Турнир' : 'Мастер-класс'}</span>
        <h1>{event.title}</h1>
        {event.host.name && <p className="event-host-line">Организатор: <strong>{event.host.name}</strong></p>}
        <div className="event-hero-meta">
          <span><Icon name="calendar" size={18} /><span><strong>{formatEventDate(event.startAt, event.endAt)}</strong>{formatEventTime(event.startAt, event.endAt)}</span></span>
          <span><Icon name="pin" size={18} /><span><strong>{event.venue.name || event.venue.city}</strong>{[event.venue.city, event.venue.address].filter(Boolean).join(', ')}</span></span>
        </div>
        <span className={`event-status status-${event.registrationStatus}`}>{registrationLabels[event.registrationStatus]}</span>
      </div>
    </section>
  )
}

export function EventRegistrationCard({ event, registrationHref, ticketHref }: {
  event: EventDetails
  registrationHref: string
  ticketHref?: string
}) {
  const disabled = event.eventStatus === 'cancelled' || event.eventStatus === 'finished' || event.registrationStatus !== 'open'
  const actionLabel = event.type === 'tournament' ? 'Зарегистрироваться' : 'Записаться'
  return (
    <aside className="registration-card">
      <span className={`event-status status-${event.registrationStatus}`}>{registrationLabels[event.registrationStatus]}</span>
      {event.minimumPrice !== undefined && <strong className="registration-price">от {formatCurrency(event.minimumPrice, event.currency)}</strong>}
      {event.registrationCloseAt && <p>Регистрация до <strong>{formatEventDate(event.registrationCloseAt)}</strong></p>}
      {event.currentUserState?.registered ? (
        <div className="registered-state"><Icon name="check" size={18} /><strong>Вы зарегистрированы</strong></div>
      ) : disabled ? (
        <button className="button primary" type="button" disabled>{actionLabel}</button>
      ) : (
        <Link className="button primary" to={registrationHref}>{actionLabel}</Link>
      )}
      {event.currentUserState?.ticketId && <Link className="button secondary" to={`/tickets/${encodeURIComponent(event.currentUserState.ticketId)}`}>Открыть билет</Link>}
      {ticketHref && !event.currentUserState?.spectatorTicketOwned && <Link className="button secondary" to={ticketHref}>Купить билет зрителя</Link>}
      {event.currentUserState?.spectatorTicketOwned && <div className="registered-state"><Icon name="ticket" size={18} /><strong>Билет зрителя куплен</strong></div>}
      <small>Продолжая регистрацию или покупку, вы соглашаетесь с правилами Ивента и условиями платформы.</small>
    </aside>
  )
}

export function EventMobileCta({ event, registrationHref, ticketHref }: {
  event: EventDetails
  registrationHref: string
  ticketHref?: string
}) {
  const disabled = event.eventStatus === 'cancelled' || event.eventStatus === 'finished' || event.registrationStatus !== 'open'
  if (event.currentUserState?.registered) return null
  const label = event.type === 'tournament' ? 'Зарегистрироваться' : 'Записаться'
  return (
    <div className="event-mobile-cta">
      <span>{event.minimumPrice !== undefined ? `от ${formatCurrency(event.minimumPrice, event.currency)}` : ''}</span>
      {!disabled ? <Link className="button primary" to={registrationHref}>{label}</Link> : ticketHref ? <Link className="button primary" to={ticketHref}>Купить билет</Link> : <button className="button primary" type="button" disabled>{label}</button>}
    </div>
  )
}

export function EventStatusBanner({ event }: { event: EventDetails }) {
  if (event.eventStatus !== 'cancelled') return null
  return <div className="event-warning" role="alert"><strong>Ивент отменен</strong><p>Организатор отменил мероприятие. Если вы уже оплатили участие или билет, возврат будет обработан согласно правилам платформы.</p></div>
}
