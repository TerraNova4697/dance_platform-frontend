import { frappeFetch } from './frappe'

export interface NearbySummaryRecord {
  city?: string
  upcomingCount: number
}

type NearbySummaryResponse = NearbySummaryRecord | { message: NearbySummaryRecord }

export async function fetchNearbySummary(userId: string, city = ''): Promise<NearbySummaryRecord> {
  const query = new URLSearchParams({ user_id: userId, city })
  const response = await frappeFetch<NearbySummaryResponse>(
    `/api/method/dance_platform.api.get_nearby_summary.get_nearby_summary?${query}`,
  )
  return 'message' in response ? response.message : response
}
