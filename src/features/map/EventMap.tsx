import { useEffect, useMemo } from 'react'
import { CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Link } from 'react-router-dom'
import { routes } from '../../routes'
import type { EventPreview } from '../../types/dashboard'
import { formatCurrency } from '../../utils/currency'
import { formatDay } from '../../utils/date'
import { Icon } from '../../pages/dashboard/components/Icons'

type MappableEvent = EventPreview & { latitude?: number; longitude?: number }
type EventWithCoordinates = MappableEvent & { latitude: number; longitude: number }

const defaultCenter: [number, number] = [43.238_949, 76.889_709]
const twoGisApiKey = import.meta.env.VITE_DGIS_API_KEY?.trim()
const twoGisTilesUrl = `https://tile{s}.maps.2gis.com/v2/tiles/online_sd/{z}/{x}/{y}.png?key=${encodeURIComponent(twoGisApiKey ?? '')}`

function hasCoordinates(event: MappableEvent): event is EventWithCoordinates {
  return Number.isFinite(event.latitude) && Number.isFinite(event.longitude)
}

function MapViewport({ events, selectedEventId }: { events: EventWithCoordinates[]; selectedEventId?: string }) {
  const map = useMap()
  const coordinatesKey = events.map(({ id, latitude, longitude }) => `${id}:${latitude}:${longitude}`).join('|')
  const selected = events.find((event) => event.id === selectedEventId)

  useEffect(() => {
    if (events.length === 1) {
      map.setView([events[0].latitude, events[0].longitude], 13)
    } else if (events.length > 1) {
      map.fitBounds(events.map(({ latitude, longitude }) => [latitude, longitude]), {
        maxZoom: 14,
        padding: [44, 44],
      })
    }
  }, [coordinatesKey, events, map])

  useEffect(() => {
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 13), { duration: 0.45 })
    }
  }, [map, selected])

  return null
}

export function EventMap({ events, selectedEventId, onSelect }: {
  events: MappableEvent[]
  selectedEventId?: string
  onSelect: (id: string) => void
}) {
  const markers = useMemo(() => events.filter(hasCoordinates), [events])
  const selected = events.find((event) => event.id === selectedEventId)

  if (!twoGisApiKey) {
    return (
      <div className="event-map map-configuration" role="status">
        <Icon name="map" size={32} />
        <strong>Для карты нужен ключ 2GIS</strong>
        <span>Добавьте VITE_DGIS_API_KEY в локальное окружение и перезапустите приложение.</span>
      </div>
    )
  }

  return (
    <div className="event-map" aria-label="Карта найденных Ивентов">
      <MapContainer center={defaultCenter} zoom={11} maxZoom={18} scrollWheelZoom className="event-map-canvas">
        <TileLayer
          url={twoGisTilesUrl}
          subdomains={['0', '1', '2', '3', '4']}
          minZoom={1}
          maxZoom={18}
          attribution={'&copy; <a href="https://2gis.com/">2GIS</a>'}
        />
        <MapViewport events={markers} selectedEventId={selectedEventId} />
        {markers.map((event) => {
          const isSelected = selectedEventId === event.id
          return (
            <CircleMarker
              key={event.id}
              center={[event.latitude, event.longitude]}
              radius={isSelected ? 13 : 10}
              pathOptions={{
                color: '#ffffff',
                fillColor: isSelected ? '#30229d' : '#5b48e8',
                fillOpacity: 1,
                opacity: 1,
                weight: 3,
              }}
              eventHandlers={{ click: () => onSelect(event.id) }}
            />
          )
        })}
      </MapContainer>
      {!markers.length && (
        <div className="map-empty">
          <Icon name="map" size={32} />
          <strong>Нет Ивентов с координатами</strong>
          <span>Все результаты доступны в списке слева.</span>
        </div>
      )}
      {selected && (
        <article className="map-event-preview">
          <button type="button" aria-label="Закрыть карточку" onClick={() => onSelect('')}>×</button>
          <strong>{selected.title}</strong>
          <span>{formatDay(selected.startAt)} · {selected.city}</span>
          {selected.direction && <span>{selected.direction}</span>}
          {selected.minimumPrice !== undefined && <b>от {formatCurrency(selected.minimumPrice, selected.currency)}</b>}
          <Link to={routes.event(selected.id)}>Подробнее →</Link>
        </article>
      )}
    </div>
  )
}
