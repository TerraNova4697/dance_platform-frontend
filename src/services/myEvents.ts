import { fetchMyEvents } from '../api/myEvents'
import type { RegisteredEventPreview } from '../types/dashboard'
import { normalizeCoordinate } from '../utils/coordinates'

function normalizeDate(value: string): string {
  return value.includes('T') ? value : value.replace(' ', 'T')
}

export async function getMyEvents(userId: string): Promise<RegisteredEventPreview[]> {
  const events = await fetchMyEvents(userId, 3)
  const now = Date.now()
  return events
    .map((event) => ({ ...event, startAt: normalizeDate(event.startAt), latitude: normalizeCoordinate(event.latitude), longitude: normalizeCoordinate(event.longitude) }))
    .filter((event) => Date.parse(event.startAt) >= now && event.registrationStatus !== 'cancelled')
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
    .slice(0, 3)
}

export async function getAllMyEvents(userId: string): Promise<RegisteredEventPreview[]> {
  const events = await fetchMyEvents(userId, 100)
  return events
    .map((event) => ({ ...event, startAt: normalizeDate(event.startAt), latitude: normalizeCoordinate(event.latitude), longitude: normalizeCoordinate(event.longitude) }))
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))
}
