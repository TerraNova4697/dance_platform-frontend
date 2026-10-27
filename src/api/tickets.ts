import { frappeFetch } from './frappe'

type FrappeResponse<T> = { message: T }

export type TicketSummary = {
  id: string
  ticketNumber: string
  ticketType: string
  status: 'active' | 'cancelled' | 'refunded' | 'expired'
  issuedAt: string
  tokenHash: string
  qrUrl: string
  isCheckedIn: boolean
  checkedInAt: string | null
  itemTitle: string
  event: {
    id: string
    title: string
    coverUrl?: string | null
    startAt: string
    endAt?: string | null
    city?: string
    venueName?: string
    venueAddress?: string
    hostName?: string
  }
}

export type TicketDetails = {
  id: string
  ticketNumber: string
  ticketType: string
  status: 'active' | 'cancelled' | 'refunded' | 'expired'
  issuedAt: string
  tokenHash: string
  qrUrl: string
  qrPayloadJson: string
  isCheckedIn: boolean
  checkedInAt: string | null
  checkins?: Array<{
    name: string
    checked_at: string
    checked_by: string
    result: string
  }>
  event: {
    id: string
    title: string
    coverUrl?: string | null
    startAt: string
    endAt?: string | null
    city?: string
    venueName?: string
    venueAddress?: string
    hostName?: string
  }
  person: {
    id: string
    fullName: string
    photo?: string | null
    email?: string | null
  }
  package?: {
    id: string
    title: string
    description?: string | null
    price: number
  } | null
  slots: Array<{
    id: string
    startAt: string
    endAt: string
    venueTitle?: string
  }>
}

export type VerifyTicketResult = {
  valid: boolean
  action?: 'verify' | 'checkin'
  checkedIn?: boolean
  alreadyCheckedIn?: boolean
  checkedInAt?: string
  checkedBy?: string
  reason?: string
  code?: string
  ticketId?: string
  ticketNumber?: string
  ticketType?: string
  eventId?: string
  eventTitle?: string
  personName?: string
  personPhoto?: string
  message?: string
}

export async function getMyTickets(status?: string): Promise<TicketSummary[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const response = await frappeFetch<TicketSummary[] | FrappeResponse<TicketSummary[]>>(
    `/api/method/dance_platform.api.tickets.get_my_tickets${query}`
  )
  if (Array.isArray(response)) return response
  return (response as FrappeResponse<TicketSummary[]>).message || []
}

export async function getTicketDetails(ticketId: string): Promise<TicketDetails> {
  const response = await frappeFetch<TicketDetails | FrappeResponse<TicketDetails>>(
    `/api/method/dance_platform.api.tickets.get_ticket_details?ticket_id=${encodeURIComponent(ticketId)}`
  )
  if ('ticketNumber' in response) return response as TicketDetails
  return (response as FrappeResponse<TicketDetails>).message
}

export async function verifyAndCheckinTicket(params: {
  tokenHash: string
  action?: 'verify' | 'checkin'
  deviceId?: string
}): Promise<VerifyTicketResult> {
  const query = new URLSearchParams()
  query.append('token_hash', params.tokenHash)
  if (params.action) query.append('action', params.action)
  if (params.deviceId) query.append('device_id', params.deviceId)

  const response = await frappeFetch<VerifyTicketResult | FrappeResponse<VerifyTicketResult>>(
    `/api/method/dance_platform.api.tickets.verify_and_checkin_ticket?${query.toString()}`,
    {
      method: 'POST',
    }
  )
  if ('valid' in response) return response as VerifyTicketResult
  return (response as FrappeResponse<VerifyTicketResult>).message
}

