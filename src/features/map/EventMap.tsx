import { Link } from 'react-router-dom'
import { routes } from '../../routes'
import type { EventPreview } from '../../types/dashboard'
import { formatCurrency } from '../../utils/currency'
import { formatDay } from '../../utils/date'
import { Icon } from '../../pages/dashboard/components/Icons'

type MappableEvent = EventPreview & { latitude?: number; longitude?: number }

export function EventMap({ events, selectedEventId, onSelect }: {
  events: MappableEvent[]
  selectedEventId?: string
  onSelect: (id: string) => void
}) {
  const markers = events.filter((event) => event.latitude !== undefined && event.longitude !== undefined)
  const selected = events.find((event) => event.id === selectedEventId)
  const latitudes = markers.map((event) => event.latitude as number)
  const longitudes = markers.map((event) => event.longitude as number)
  const minLat = Math.min(...latitudes), maxLat = Math.max(...latitudes)
  const minLng = Math.min(...longitudes), maxLng = Math.max(...longitudes)

  return (
    <div className="event-map" aria-label="Карта найденных Ивентов">
      <div className="map-grid" aria-hidden="true" />
      {!markers.length && <div className="map-empty"><Icon name="map" size={32} /><strong>Нет Ивентов с координатами</strong><span>Все результаты доступны в списке слева.</span></div>}
      {markers.map((event) => {
        const x = maxLng === minLng ? 50 : 8 + (((event.longitude as number) - minLng) / (maxLng - minLng)) * 84
        const y = maxLat === minLat ? 46 : 8 + ((maxLat - (event.latitude as number)) / (maxLat - minLat)) * 78
        return <button key={event.id} className={`event-marker${selectedEventId === event.id ? ' active' : ''}`} style={{ left: `${x}%`, top: `${y}%` }} type="button" onClick={() => onSelect(event.id)} aria-label={event.title}><Icon name="pin" size={25} /></button>
      })}
      {selected && <article className="map-event-preview"><button type="button" aria-label="Закрыть карточку" onClick={() => onSelect('')}>×</button><strong>{selected.title}</strong><span>{formatDay(selected.startAt)} · {selected.city}</span>{selected.direction && <span>{selected.direction}</span>}{selected.minimumPrice !== undefined && <b>от {formatCurrency(selected.minimumPrice, selected.currency)}</b>}<Link to={routes.event(selected.id)}>Подробнее →</Link></article>}
    </div>
  )
}
