import { Link } from 'react-router-dom'
import type { MasterClassSlot, SpectatorTicketType, TournamentCategory } from '../../../../types/eventDetails'
import { formatCurrency } from '../../../../utils/currency'
import { formatTimeRange } from '../../../../utils/date'
import { Skeleton, WidgetError } from '../../../dashboard/components/Shared'
import { formatEventDate } from '../format'
import { withRegistrationParam } from '../registrationLink'

const participationLabels = { solo: 'Solo', couple: 'Couple', team: 'Team', formation: 'Formation' } as const
const availabilityLabels = { available: 'Есть места', low: 'Осталось мало мест', full: 'Мест нет' } as const

function SectionState({ isLoading, isError, onRetry }: { isLoading: boolean; isError: boolean; onRetry: () => void }) {
  if (isLoading) return <Skeleton count={2} />
  if (isError) return <WidgetError message="Не удалось загрузить данные раздела." onRetry={onRetry} />
  return null
}

export function TournamentCategories({ categories, isLoading, isError, onRetry }: {
  categories: TournamentCategory[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  const state = <SectionState isLoading={isLoading} isError={isError} onRetry={onRetry} />
  return (
    <section className="event-content-card" id="categories">
      <h2>Категории</h2>
      {isLoading || isError ? state : categories.length ? <div className="category-grid">{categories.map((item) => <article className="category-card" key={item.id}><div><span className="type-badge">{item.discipline.name}</span><h3>{item.category.name}</h3></div><dl><div><dt>Возраст</dt><dd>{item.ageFrom !== undefined || item.ageTo !== undefined ? `${item.ageFrom ?? '—'}–${item.ageTo ?? '—'}` : 'Без ограничений'}</dd></div>{item.level?.name && <div><dt>Уровень</dt><dd>{item.level.name}</dd></div>}{item.league?.name && <div><dt>Лига</dt><dd>{item.league.name}</dd></div>}{item.className && <div><dt>Класс</dt><dd>{item.className}</dd></div>}<div><dt>Формат</dt><dd>{participationLabels[item.participationType]}</dd></div></dl><footer><span className={`availability availability-${item.availabilityStatus}`}>{availabilityLabels[item.availabilityStatus]}</span>{item.price !== undefined && <strong>{formatCurrency(item.price, item.currency ?? 'KZT')}</strong>}</footer></article>)}</div> : <p className="section-empty">Категории пока не опубликованы.</p>}
    </section>
  )
}

export function MasterClassSlots({ eventId, slots, isLoading, isError, onRetry, registrationHref }: {
  eventId: string
  slots: MasterClassSlot[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  registrationHref: string
}) {
  const state = <SectionState isLoading={isLoading} isError={isError} onRetry={onRetry} />
  return (
    <section className="event-content-card" id="slots">
      <h2>Доступные занятия</h2>
      {isLoading || isError ? state : slots.length ? <div className="slot-list">{slots.map((slot) => { const disabled = slot.availabilityStatus === 'full' || slot.availabilityStatus === 'cancelled'; return <article className="slot-card" key={slot.id}><div><span>{formatEventDate(slot.startAt)}</span><strong>{formatTimeRange(slot.startAt, slot.endAt)}</strong></div><div><h3>{slot.title ?? 'Мастер-класс'}</h3>{slot.venue?.name && <small>{slot.venue.name}</small>}<span className={`availability availability-${slot.availabilityStatus}`}>{slot.availabilityStatus === 'cancelled' ? 'Занятие отменено' : slot.availablePlaces !== undefined && slot.availabilityStatus === 'low' ? `Осталось ${slot.availablePlaces} мест` : availabilityLabels[slot.availabilityStatus]}</span></div><div>{slot.price !== undefined && <strong>{formatCurrency(slot.price, slot.currency ?? 'KZT')}</strong>}{disabled ? <button className="button secondary" type="button" disabled>Выбрать</button> : <Link className="button secondary" to={withRegistrationParam(registrationHref, 'slot', slot.id)} state={{ eventId }}>Выбрать</Link>}</div></article> })}</div> : <p className="section-empty">Доступные занятия пока не опубликованы.</p>}
    </section>
  )
}

export function SpectatorTickets({ eventId, tickets, isLoading, isError, onRetry, purchaseBaseHref }: {
  eventId: string
  tickets: SpectatorTicketType[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  purchaseBaseHref: string
}) {
  if (!isLoading && !isError && !tickets.length) return null
  const state = <SectionState isLoading={isLoading} isError={isError} onRetry={onRetry} />
  return (
    <section className="event-content-card" id="tickets"><h2>Билеты для зрителей</h2>{isLoading || isError ? state : <div className="ticket-type-list">{tickets.map((ticket) => <article key={ticket.id}><div><strong>{ticket.title}</strong><span className={`availability availability-${ticket.availabilityStatus}`}>{ticket.availabilityStatus === 'sold_out' ? 'Продано' : ticket.availabilityStatus === 'unavailable' ? 'Продажа недоступна' : ticket.availabilityStatus === 'low' ? 'Осталось мало' : 'В продаже'}</span></div><b>{formatCurrency(ticket.price, ticket.currency)}</b>{(ticket.availabilityStatus === 'sold_out' || ticket.availabilityStatus === 'unavailable') ? <button className="button secondary" type="button" disabled>Купить</button> : <Link className="button secondary" to={`${purchaseBaseHref}?ticket_type=${encodeURIComponent(ticket.id)}`} state={{ eventId }}>Купить</Link>}</article>)}</div>}</section>
  )
}
