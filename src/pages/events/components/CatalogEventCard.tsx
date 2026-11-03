import { Link } from 'react-router-dom'
import { routes } from '../../../routes'
import type { EventPreview } from '../../../types/dashboard'
import { formatCurrency } from '../../../utils/currency'
import { formatDateRange } from '../../../utils/date'
import { Icon } from '../../dashboard/components/Icons'

const typeLabels = {
  tournament: 'Соревнования',
  master_class: 'Мастер-классы и сборы',
} as const

function locationLabel(city?: string, country?: string): string {
  return [city, country].filter(Boolean).join(', ')
}

export function CatalogEventCard({
  event,
  compact = false,
  selected = false,
  onSelect,
}: {
  event: EventPreview
  compact?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const dates = formatDateRange(event.startAt, event.endAt)
  const location = locationLabel(event.city, event.country)
  const isMasterClass = event.type === 'master_class'
  const unit = event.pricingUnit || (isMasterClass ? ' / урок' : '')

  if (compact) {
    return (
      <button className={`catalog-compact-card${selected ? ' selected' : ''}`} type="button" onClick={onSelect}>
        <span className="compact-cover" style={event.coverUrl ? { backgroundImage: `url(${event.coverUrl})` } : undefined} />
        <span className="compact-copy">
          <span className={`type-badge type-${event.type}`}>{typeLabels[event.type]}</span>
          <strong>{event.title}</strong>
          <small>{dates} · {location}</small>
          {event.minimumPrice !== undefined && event.minimumPrice !== null ? (
            <b>от {formatCurrency(event.minimumPrice, event.currency)}{unit}</b>
          ) : (
            <span className="price-terms">Стоимость по положению</span>
          )}
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
        <div className="catalog-card-header">
          <span className={`type-badge type-${event.type}`}>{typeLabels[event.type]}</span>
          {event.isArchived && <span className="archive-badge">Архив</span>}
        </div>
        <h2>{event.title}</h2>
        <p className="catalog-date">{dates} · {location}</p>
        {event.venueName && (
          <span className="catalog-meta">
            <Icon name="pin" size={15} />
            {event.venueName}
          </span>
        )}
        {event.direction && <span className="direction-label">{event.direction}</span>}
        <div className="catalog-card-footer">
          <span>{event.hostName}</span>
          {event.minimumPrice !== undefined && event.minimumPrice !== null ? (
            <strong>
              от {formatCurrency(event.minimumPrice, event.currency)}
              {unit && <span className="unit-label">{unit}</span>}
            </strong>
          ) : (
            <span className="price-terms">Стоимость по положению</span>
          )}
        </div>
      </div>
    </Link>
  )
}
