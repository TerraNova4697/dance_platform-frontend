import { frappeFetch } from './frappe'

export interface UpcomingEventRecord {
  id: string
  type: 'tournament' | 'master_class'
  title: string
  coverUrl?: string
  startAt: string
  endAt?: string
  city: string
  country?: string
  venueName?: string
  direction?: string
  hostName: string
  minimumPrice?: number
  pricingUnit?: string
  currency: 'KZT' | 'RUB' | 'USD' | 'EUR'
  latitude?: number | string
  longitude?: number | string
  isArchived?: boolean
  relatedEvent?: {
    id?: string
    title: string
    type: string
    dates?: string
    tag?: string
  }
}

export interface UpcomingEventsParams {
  userId?: string
  city?: string
  country?: string
  period?: 'today' | 'week' | 'all' | 'archived'
  type?: 'tournament' | 'master_class' | 'all'
  scope?: 'world' | 'country' | 'city'
  isArchived?: boolean | number
  limit?: number
}

type UpcomingEventsResponse = UpcomingEventRecord[] | { message: UpcomingEventRecord[] }

export async function fetchUpcomingEvents({
  userId,
  city,
  country,
  period = 'all',
  type = 'all',
  scope = 'world',
  isArchived = 0,
  limit = 20,
}: UpcomingEventsParams): Promise<UpcomingEventRecord[]> {
  const query = new URLSearchParams()
  if (userId) query.set('user_id', userId)
  if (city) query.set('city', city)
  if (country) query.set('country', country)
  if (period) query.set('period', period)
  if (type) query.set('type', type)
  if (scope) query.set('scope', scope)
  if (isArchived) query.set('is_archived', '1')
  query.set('limit', String(limit))

  const response = await frappeFetch<UpcomingEventsResponse>(
    `/api/method/dance_platform.api.get_upcoming_events.get_upcoming_events?${query}`,
  )
  return Array.isArray(response) ? response : response.message
}
