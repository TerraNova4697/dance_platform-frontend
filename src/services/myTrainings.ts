import { fetchMyTrainings } from '../api/myTrainings'
import type { TrainingBookingPreview } from '../types/dashboard'

function normalizeDate(value: string): string {
  return value.includes('T') ? value : value.replace(' ', 'T')
}

export async function getMyTrainings(userId: string): Promise<TrainingBookingPreview[]> {
  const trainings = await fetchMyTrainings(userId, 20)
  const now = Date.now()
  return trainings
    .map((training) => ({
      ...training,
      startAt: normalizeDate(training.startAt),
      endAt: normalizeDate(training.endAt),
    }))
    .filter((training) => (
      Date.parse(training.startAt) >= now
      && training.status !== 'cancelled'
      && training.status !== 'completed'
    ))
    .sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt))
    .slice(0, 3)
}
