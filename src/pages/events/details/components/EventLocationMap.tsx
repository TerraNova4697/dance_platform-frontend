import { useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const twoGisApiKey = import.meta.env.VITE_DGIS_API_KEY?.trim()
const tilesUrl = `https://tile{s}.maps.2gis.com/v2/tiles/online_sd/{z}/{x}/{y}.png?key=${encodeURIComponent(twoGisApiKey ?? '')}`

export default function EventLocationMap({ latitude, longitude, title, address }: {
  latitude: number
  longitude: number
  title: string
  address?: string
}) {
  const [hasTileError, setHasTileError] = useState(false)

  if (!twoGisApiKey || hasTileError) {
    return (
      <div className="event-location-map map-unavailable" role="status">
        <strong>{twoGisApiKey ? 'Не удалось загрузить карту' : 'Для карты нужен ключ 2GIS'}</strong>
        <span>{title}{address ? ` · ${address}` : ''}</span>
      </div>
    )
  }

  return (
    <MapContainer center={[latitude, longitude]} zoom={16} maxZoom={18} scrollWheelZoom={false} className="event-location-map" aria-label={`Место проведения: ${title}`}>
      <TileLayer
        url={tilesUrl}
        subdomains={['0', '1', '2', '3', '4']}
        minZoom={1}
        maxZoom={18}
        attribution={'&copy; <a href="https://2gis.com/">2GIS</a>'}
        eventHandlers={{ tileerror: () => setHasTileError(true) }}
      />
      <CircleMarker center={[latitude, longitude]} radius={11} pathOptions={{ color: '#fff', fillColor: '#5b48e8', fillOpacity: 1, weight: 3 }}>
        <Popup><strong>{title}</strong>{address && <><br />{address}</>}</Popup>
      </CircleMarker>
    </MapContainer>
  )
}
