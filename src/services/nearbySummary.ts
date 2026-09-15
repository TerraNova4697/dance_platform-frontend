import { fetchNearbySummary } from '../api/nearbySummary'

export interface NearbyEventsSummary {
  city?: string
  upcomingCount: number
}

export async function getNearbySummary(userId: string): Promise<NearbyEventsSummary> {
  return fetchNearbySummary(userId)
}
