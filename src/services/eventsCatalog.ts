import { fetchUpcomingEvents } from '../api/upcomingEvents'
import type { EventPreview } from '../types/dashboard'

function normalizeDate(value: string): string {
  return value.includes('T') ? value : value.replace(' ', 'T')
}

export async function getEventsCatalog(userId: string, city: string): Promise<EventPreview[]> {
  const events = await fetchUpcomingEvents({ userId, city, period: 'all', type: 'all', limit: 20 })
  return events.map((event) => ({ ...event, startAt: normalizeDate(event.startAt) }))
}
