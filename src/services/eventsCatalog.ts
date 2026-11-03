import { fetchUpcomingEvents, type UpcomingEventsParams } from '../api/upcomingEvents'
import type { EventPreview } from '../types/dashboard'
import { normalizeCoordinate } from '../utils/coordinates'

function normalizeDate(value?: string): string | undefined {
  if (!value) return undefined
  return value.includes('T') ? value : value.replace(' ', 'T')
}

export async function getEventsCatalog(params?: UpcomingEventsParams): Promise<EventPreview[]> {
  const events = await fetchUpcomingEvents({
    scope: 'world',
    period: 'all',
    type: 'all',
    limit: 50,
    ...params,
  })
  return events.map((event) => ({
    ...event,
    startAt: normalizeDate(event.startAt) ?? '',
    endAt: normalizeDate(event.endAt),
    latitude: normalizeCoordinate(event.latitude),
    longitude: normalizeCoordinate(event.longitude),
  }))
}
