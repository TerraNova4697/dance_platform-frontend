import { fetchUpcomingEvents } from '../api/upcomingEvents'
import type { EventPreview } from '../types/dashboard'

function normalizeDate(value: string): string {
  return value.includes('T') ? value : value.replace(' ', 'T')
}

export async function getUpcomingEvents(userId: string): Promise<EventPreview[]> {
  const events = await fetchUpcomingEvents({ userId, period: 'all', type: 'all', limit: 6 })
  return events.map((event) => ({ ...event, startAt: normalizeDate(event.startAt) }))
}
