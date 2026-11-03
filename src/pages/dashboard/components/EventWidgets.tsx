import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { routes } from '../../../routes'
import type { EventPreview, RegisteredEventPreview } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/currency'
import { formatDateRange } from '../../../utils/date'
import { Icon } from './Icons'
import { EmptyState, Meta, SectionHeading, Skeleton, WidgetError } from './Shared'

const eventTypeLabel = { tournament: 'Соревнования', master_class: 'Мастер-классы и сборы' } as const

function locationLabel(city?: string, country?: string): string {
  return [city, country].filter(Boolean).join(', ')
}

export function MyEventsSection({ query }: { query: UseQueryResult<RegisteredEventPreview[], Error> }) {
  return (
    <section className="dashboard-section">
      <SectionHeading title="Мои мероприятия" to={routes.myEvents} />
      {query.isPending ? (
        <Skeleton count={2} />
      ) : query.isError ? (
        <WidgetError message="Не удалось загрузить ваши мероприятия." onRetry={() => void query.refetch()} />
      ) : !query.data.length ? (
        <EmptyState
          title="У вас пока нет мероприятий"
          description="Найдите ближайшее мероприятие и зарегистрируйтесь."
          action={
            <Link className="button primary" to={routes.events}>
              Найти мероприятие
            </Link>
          }
        />
      ) : (
        <div className="cards-grid cards-grid-two">
          {query.data.map((event, index) => (
            <article className={`my-event-card cover-tone-${index + 1}`} key={event.id}>
              <div
                className="event-cover"
                style={event.coverUrl ? { backgroundImage: `url(${event.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                <span>{event.direction}</span>
              </div>
              <div className="card-body">
                <span className={`type-badge type-${event.type}`}>{eventTypeLabel[event.type]}</span>
                <h3>
                  <Link to={routes.event(event.id)}>{event.title}</Link>
                </h3>
                <div className="stacked-meta">
                  <Meta icon="clock">{formatDateRange(event.startAt, event.endAt)}</Meta>
                  <Meta icon="pin">{locationLabel(event.venueName ?? event.city, event.country)}</Meta>
                </div>
                <div className="entry-list">
                  {event.entries.map((entry) => (
                    <span key={entry.id}>{entry.label}</span>
                  ))}
                </div>
                <p className="confirmed">
                  <Icon name="check" size={16} /> Регистрация подтверждена
                </p>
                <div className="card-actions">
                  <Link to={routes.event(event.id)}>Подробнее</Link>
                  {event.ticketId && <Link to={routes.ticket(event.ticketId)}>Билет →</Link>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function renderEventCard(event: EventPreview, index: number) {
  const dates = formatDateRange(event.startAt, event.endAt)
  const location = locationLabel(event.city, event.country)
  const isMasterClass = event.type === 'master_class'
  const unit = event.pricingUnit || (isMasterClass ? ' / урок' : '')

  return (
    <Link className={`event-card cover-tone-${(index % 3) + 1}`} to={routes.event(event.id)} key={event.id}>
      <div
        className="event-cover"
        style={event.coverUrl ? { backgroundImage: `url(${event.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <span>{event.direction ?? eventTypeLabel[event.type]}</span>
      </div>
      <div className="card-body">
        <span className={`type-badge type-${event.type}`}>{eventTypeLabel[event.type]}</span>
        <h3>{event.title}</h3>
        <div className="stacked-meta">
          <Meta icon="calendar">{dates}</Meta>
          <Meta icon="pin">{location}</Meta>
        </div>
        <div className="event-card-bottom">
          <div>
            {event.minimumPrice !== undefined && event.minimumPrice !== null ? (
              <strong className="price">
                от {formatCurrency(event.minimumPrice, event.currency)}{unit}
              </strong>
            ) : (
              <span className="price-terms">Стоимость по положению</span>
            )}
            <span className="host">{event.hostName}</span>
          </div>
          <span className="card-arrow-circle" aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  )
}

export function UpcomingEventsSection({ query }: { query: UseQueryResult<EventPreview[], Error> }) {
  if (query.isPending) {
    return (
      <section className="dashboard-section discovery-section">
        <SectionHeading title="Ближайшие соревнования" />
        <Skeleton count={3} />
      </section>
    )
  }

  if (query.isError) {
    return (
      <section className="dashboard-section discovery-section">
        <WidgetError message="Не удалось загрузить мероприятия." onRetry={() => void query.refetch()} />
      </section>
    )
  }

  const allEvents = query.data ?? []
  const tournaments = allEvents.filter((event) => event.type === 'tournament' && !event.isArchived).slice(0, 3)
  const masterClasses = allEvents.filter((event) => event.type === 'master_class' && !event.isArchived).slice(0, 3)

  return (
    <>
      <section className="dashboard-section discovery-section">
        <SectionHeading title="Ближайшие соревнования" to="/events?type=tournament" />
        {!tournaments.length ? (
          <EmptyState title="Предстоящих соревнований пока нет" />
        ) : (
          <div className="cards-grid events-grid">
            {tournaments.map((event, index) => renderEventCard(event, index))}
          </div>
        )}
        <Link className="button secondary all-events-button" to="/events?type=tournament">
          Все соревнования →
        </Link>
      </section>

      <section className="dashboard-section discovery-section" style={{ marginTop: '28px' }}>
        <SectionHeading title="Мастер-классы и сборы" to="/events?type=master_class" />
        {!masterClasses.length ? (
          <EmptyState title="Предстоящих мастер-классов пока нет" />
        ) : (
          <div className="cards-grid events-grid">
            {masterClasses.map((event, index) => renderEventCard(event, index))}
          </div>
        )}
        <Link className="button secondary all-events-button" to="/events?type=master_class">
          Все мастер-классы и сборы →
        </Link>
      </section>
    </>
  )
}
