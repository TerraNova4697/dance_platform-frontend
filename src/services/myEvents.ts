import { fetchMyEvents } from '../api/myEvents'
import type { RegisteredEventPreview } from '../types/dashboard'

function normalizeDate(value: string): string {
  return value.includes('T') ? value : value.replace(' ', 'T')
}

export async function getMyEvents(userId: string): Promise<RegisteredEventPreview[]> {
  const events = await fetchMyEvents(userId, 3)
  return events.map((event) => ({ ...event, startAt: normalizeDate(event.startAt) }))
}
