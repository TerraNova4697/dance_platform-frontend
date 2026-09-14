import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { routes } from '../../../routes'
import type { EventPreview, RegisteredEventPreview } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/currency'
import { formatDay } from '../../../utils/date'
import { Icon } from './Icons'
import { EmptyState, Meta, SectionHeading, Skeleton, WidgetError } from './Shared'

const eventTypeLabel = { tournament: 'Турнир', master_class: 'Мастер-класс' } as const

export function MyEventsSection({ query }: { query: UseQueryResult<RegisteredEventPreview[], Error> }) {
  return <section className="dashboard-section"><SectionHeading title="Мои Ивенты" to={routes.myEvents} />{query.isPending ? <Skeleton count={2} /> : query.isError ? <WidgetError message="Не удалось загрузить ваши Ивенты." onRetry={() => void query.refetch()} /> : !query.data.length ? <EmptyState title="У вас пока нет Ивентов" description="Найдите ближайшее мероприятие и зарегистрируйтесь." action={<Link className="button primary" to={routes.events}>Найти Ивент</Link>} /> : <div className="cards-grid cards-grid-two">{query.data.map((event, index) => <article className={`my-event-card cover-tone-${index + 1}`} key={event.id}><div className="event-cover"><span>{event.direction}</span></div><div className="card-body"><span className={`type-badge type-${event.type}`}>{eventTypeLabel[event.type]}</span><h3><Link to={routes.event(event.id)}>{event.title}</Link></h3><div className="stacked-meta"><Meta icon="clock">{formatDay(event.startAt)}</Meta><Meta icon="pin">{event.venueName ?? event.city}</Meta></div><div className="entry-list">{event.entries.map((entry) => <span key={entry.id}>{entry.label}</span>)}</div><p className="confirmed"><Icon name="check" size={16} /> Регистрация подтверждена</p><div className="card-actions"><Link to={routes.event(event.id)}>Подробнее</Link>{event.ticketId && <Link to={routes.ticket(event.ticketId)}>Билет →</Link>}</div></div></article>)}</div>}</section>
}

type Filter = 'all' | 'today' | 'week' | 'tournament' | 'master_class'
const filters: { value: Filter; label: string }[] = [{ value: 'today', label: 'Сегодня' }, { value: 'week', label: 'Эта неделя' }, { value: 'tournament', label: 'Турниры' }, { value: 'master_class', label: 'Мастер-классы' }]

export function UpcomingEventsSection({ query }: { query: UseQueryResult<EventPreview[], Error> }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [referenceTime] = useState(() => Date.now())
  const events = query.data?.filter((event) => {
    if (filter === 'all') return true
    if (filter === 'tournament' || filter === 'master_class') return event.type === filter
    const days = (Date.parse(event.startAt) - referenceTime) / 86_400_000
    return filter === 'today' ? days < 1 : days < 7
  }) ?? []
  return <section className="dashboard-section discovery-section"><SectionHeading title="Предстоящие Ивенты" /><div className="filter-chips"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type="button">Все</button>{filters.map((item) => <button className={filter === item.value ? 'active' : ''} key={item.value} onClick={() => setFilter(item.value)} type="button">{item.label}</button>)}</div>{query.isPending ? <Skeleton count={3} /> : query.isError ? <WidgetError message="Не удалось загрузить ближайшие Ивенты." onRetry={() => void query.refetch()} /> : !events.length ? <EmptyState title="По этому фильтру Ивентов пока нет" /> : <div className="cards-grid events-grid">{events.map((event, index) => <Link className={`event-card cover-tone-${(index % 3) + 1}`} to={routes.event(event.id)} key={event.id}><div className="event-cover"><span>{event.direction}</span></div><div className="card-body"><span className={`type-badge type-${event.type}`}>{eventTypeLabel[event.type]}</span><h3>{event.title}</h3><div className="event-date">{formatDay(event.startAt)}</div><div className="stacked-meta"><Meta icon="pin">{event.city}</Meta></div>{event.minimumPrice !== undefined && <strong className="price">от {formatCurrency(event.minimumPrice, event.currency)}</strong>}<span className="host">{event.hostName}</span></div></Link>)}</div>}<Link className="button secondary all-events-button" to={routes.events}>Посмотреть все Ивенты</Link></section>
}
