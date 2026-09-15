import { frappeFetch } from './frappe'

export interface ScheduleActivityRecord {
  id: string
  type: 'tournament' | 'master_class' | 'training'
  title: string
  startAt: string
  endAt?: string
  venueName?: string
  secondaryInfo?: string
  status: string
  ticketId?: string
}

type ScheduleResponse = ScheduleActivityRecord[] | { message: ScheduleActivityRecord[] }

export async function fetchSchedule(userId: string, limit = 5): Promise<ScheduleActivityRecord[]> {
  const query = new URLSearchParams({ user_id: userId, limit: String(limit) })
  const response = await frappeFetch<ScheduleResponse>(
    `/api/method/dance_platform.api.get_schedule.get_schedule?${query}`,
  )
  return Array.isArray(response) ? response : response.message
}
