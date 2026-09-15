import { Link } from 'react-router-dom'
import { routes } from '../../../routes'
import type { EventPreview } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/currency'
import { formatDay } from '../../../utils/date'
import { Icon } from '../../dashboard/components/Icons'

const typeLabels = { tournament: 'Турнир', master_class: 'Мастер-класс' } as const

export function CatalogEventCard({ event, compact = false, selected = false, onSelect }: {
  event: EventPreview
  compact?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  if (compact) {
    return (
      <button className={`catalog-compact-card${selected ? ' selected' : ''}`} type="button" onClick={onSelect}>
        <span className="compact-cover" style={event.coverUrl ? { backgroundImage: `url(${event.coverUrl})` } : undefined} />
        <span className="compact-copy">
          <span className={`type-badge type-${event.type}`}>{typeLabels[event.type]}</span>
          <strong>{event.title}</strong>
          <small>{formatDay(event.startAt)} · {event.city}</small>
          {event.minimumPrice !== undefined && <b>от {formatCurrency(event.minimumPrice, event.currency)}</b>}
        </span>
      </button>
    )
  }

  return (
    <Link className="catalog-event-card" to={routes.event(event.id)}>
      <div className="catalog-cover" style={event.coverUrl ? { backgroundImage: `url(${event.coverUrl})` } : undefined}>
        {!event.coverUrl && <span>{event.direction ?? typeLabels[event.type]}</span>}
      </div>
      <div className="catalog-card-body">
        <span className={`type-badge type-${event.type}`}>{typeLabels[event.type]}</span>
        <h2>{event.title}</h2>
        <p className="catalog-date">{formatDay(event.startAt)} · {event.city}</p>
        {event.venueName && <span className="catalog-meta"><Icon name="pin" size={15} />{event.venueName}</span>}
        {event.direction && <span className="direction-label">{event.direction}</span>}
        <div className="catalog-card-footer">
          <span>{event.hostName}</span>
          {event.minimumPrice !== undefined && <strong>от {formatCurrency(event.minimumPrice, event.currency)}</strong>}
        </div>
      </div>
    </Link>
  )
}
