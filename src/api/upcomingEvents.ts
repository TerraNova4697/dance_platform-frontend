import { frappeFetch } from './frappe'

export interface UpcomingEventRecord {
  id: string
  type: 'tournament' | 'master_class'
  title: string
  coverUrl?: string
  startAt: string
  city: string
  venueName?: string
  direction?: string
  hostName: string
  minimumPrice?: number
  currency: 'KZT' | 'RUB' | 'USD' | 'EUR'
  latitude?: number
  longitude?: number
  ageGroups?: string[]
  levels?: string[]
}

export interface UpcomingEventsParams {
  userId: string
  city?: string
  period?: 'today' | 'week' | 'all'
  type?: 'tournament' | 'master_class' | 'all'
  limit?: number
}

type UpcomingEventsResponse = UpcomingEventRecord[] | { message: UpcomingEventRecord[] }

export async function fetchUpcomingEvents({
  userId,
  city = '',
  period = 'all',
  type = 'all',
  limit = 6,
}: UpcomingEventsParams): Promise<UpcomingEventRecord[]> {
  const query = new URLSearchParams({
    user_id: userId,
    city,
    period,
    type,
    limit: String(limit),
  })
  const response = await frappeFetch<UpcomingEventsResponse>(
    `/api/method/dance_platform.api.get_upcoming_events.get_upcoming_events?${query}`,
  )
  return Array.isArray(response) ? response : response.message
}
