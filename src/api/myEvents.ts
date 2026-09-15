import { frappeFetch } from './frappe'

export interface MyEventRecord {
  id: string
  type: 'tournament' | 'master_class'
  title: string
  coverUrl?: string
  startAt: string
  city: string
  venueName?: string
  direction?: string
  latitude?: number | string
  longitude?: number | string
  hostName: string
  currency: 'KZT' | 'RUB' | 'USD' | 'EUR'
  registrationStatus: 'pending_payment' | 'confirmed' | 'cancelled' | 'transferred'
  entries: { id: string; label: string }[]
  ticketId?: string
}

type MyEventsResponse = MyEventRecord[] | { message: MyEventRecord[] }

export async function fetchMyEvents(userId: string, limit = 3): Promise<MyEventRecord[]> {
  const query = new URLSearchParams({ user_id: userId, limit: String(limit) })
  const response = await frappeFetch<MyEventsResponse>(
    `/api/method/dance_platform.api.get_my_events.get_my_events?${query}`,
  )
  return Array.isArray(response) ? response : response.message
}
