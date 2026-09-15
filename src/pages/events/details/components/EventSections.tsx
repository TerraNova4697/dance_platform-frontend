import { lazy, Suspense, type ReactNode } from 'react'
import type { EventDetails, EventScheduleItem, EventVenue } from '../../../../types/eventDetails'
import { formatCurrency } from '../../../../utils/currency'
import { formatTimeRange } from '../../../../utils/date'
import { Skeleton } from '../../../dashboard/components/Shared'
import { formatEventDate, formatScheduleDay } from '../format'

const EventLocationMap = lazy(() => import('./EventLocationMap'))

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return <section className="event-content-card" id={id}><h2>{title}</h2>{children}</section>
}

export function EventAbout({ event }: { event: EventDetails }) {
  if (!event.description) return null
  return <Section id="about" title="Об Ивенте"><p className="event-long-copy">{event.description}</p></Section>
}

export function EventPoster({ event }: { event: EventDetails }) {
  if (!event.posterUrl) return null
  return <Section title="Афиша"><a className="event-poster" href={event.posterUrl} target="_blank" rel="noreferrer"><img src={event.posterUrl} alt={`Афиша Ивента «${event.title}»`} /></a></Section>
}

export function EventSchedule({ event }: { event: EventDetails }) {
  if (!event.schedule.length) return null
  const grouped = event.schedule.reduce<Map<string, EventScheduleItem[]>>((result, item) => {
    const key = new Date(item.startAt).toDateString()
    result.set(key, [...(result.get(key) ?? []), item])
    return result
  }, new Map())
  return (
    <Section id="schedule" title="Расписание">
      <div className="event-schedule-groups">
        {[...grouped.values()].map((items) => <div className="event-schedule-day" key={items[0].startAt}><h3>{formatScheduleDay(items[0].startAt)}</h3>{items.map((item) => <div className="event-schedule-item" key={item.id}><time>{formatTimeRange(item.startAt, item.endAt)}</time><span><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}{item.location && <small>{item.location}</small>}</span></div>)}</div>)}
      </div>
    </Section>
  )
}

export function EventPeople({ event }: { event: EventDetails }) {
  const targetRole = event.type === 'tournament' ? 'judge' : 'instructor'
  const people = event.people.filter((person) => person.role === targetRole)
  if (!people.length) return null
  return <Section title={event.type === 'tournament' ? 'Судьи' : 'Преподаватели'}><div className="event-people">{people.map((person) => <article key={person.id}>{person.photoUrl ? <img src={person.photoUrl} alt="" /> : <span>{person.name.charAt(0)}</span>}<strong>{person.name}</strong><small>{person.roleLabel ?? (targetRole === 'judge' ? 'Судья' : 'Преподаватель')}</small></article>)}</div></Section>
}

export function EventPricing({ event }: { event: EventDetails }) {
  if (!event.pricing.length && event.minimumPrice === undefined) return null
  return <Section id="pricing" title="Стоимость"><div className="event-price-list">{event.pricing.length ? event.pricing.map((price) => <article key={price.id}><span><strong>{price.label}</strong>{price.description && <small>{price.description}</small>}{price.validTo && <small>до {formatEventDate(price.validTo)}</small>}</span><b>{formatCurrency(price.price, price.currency)}</b></article>) : <article><strong>Участие</strong><b>от {formatCurrency(event.minimumPrice as number, event.currency)}</b></article>}</div></Section>
}

export function EventLocation({ venue, isLoading }: { venue: EventVenue; isLoading?: boolean }) {
  const hasCoordinates = venue.latitude !== undefined && venue.longitude !== undefined
  return (
    <Section id="location" title="Место проведения">
      <div className="venue-copy"><strong>{venue.name}</strong><span>{[venue.city, venue.address].filter(Boolean).join(', ')}</span></div>
      {isLoading ? <Skeleton variant="feature" /> : hasCoordinates ? <Suspense fallback={<Skeleton variant="feature" />}><EventLocationMap latitude={venue.latitude as number} longitude={venue.longitude as number} title={venue.name} address={venue.address} /></Suspense> : <p className="coordinates-missing">Координаты места пока не указаны</p>}
    </Section>
  )
}

export function EventRules({ event }: { event: EventDetails }) {
  if (!event.rules) return null
  return <Section id="rules" title="Правила"><details className="event-rules"><summary>Ознакомиться с правилами</summary><p className="event-long-copy">{event.rules}</p></details></Section>
}

export function EventContactsAndOrganizer({ event }: { event: EventDetails }) {
  return <>{event.contacts.length > 0 && <Section title="Контакты"><div className="event-contacts">{event.contacts.map((contact) => <article key={contact.id}>{contact.name && <strong>{contact.name}</strong>}{contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}{contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}</article>)}</div></Section>}<Section title="Организатор"><div className="event-organizer">{event.host.logoUrl ? <img src={event.host.logoUrl} alt="" /> : <span>{event.host.name.charAt(0) || 'D'}</span>}<div><strong>{event.host.name || 'Организатор Ивента'}</strong>{event.host.type && <small>{event.host.type}</small>}</div></div></Section></>
}
