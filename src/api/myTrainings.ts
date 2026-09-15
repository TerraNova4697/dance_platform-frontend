import { frappeFetch } from './frappe'

export interface MyTrainingRecord {
  id: string
  title: string
  trainerId: string
  trainerName: string
  trainerAvatarUrl?: string
  startAt: string
  endAt: string
  venueName?: string
  status: 'booked' | 'rescheduled' | 'cancelled' | 'completed'
}

type MyTrainingsResponse = MyTrainingRecord[] | { message: MyTrainingRecord[] }

export async function fetchMyTrainings(userId: string, limit = 20): Promise<MyTrainingRecord[]> {
  const query = new URLSearchParams({ user_id: userId, limit: String(limit) })
  const response = await frappeFetch<MyTrainingsResponse>(
    `/api/method/dance_platform.api.get_my_trainings.get_my_trainings?${query}`,
  )
  return Array.isArray(response) ? response : response.message
}
