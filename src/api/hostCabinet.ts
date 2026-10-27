import { frappeFetch } from './frappe'
import type { MasterClassPackageItem, MasterClassSlotItem, VenueItem } from './trainerCabinet'

type FrappeResponse<T> = { message: T }

export type HostVerificationStatus = 'Not Verified' | 'Pending' | 'Verified' | 'Rejected'
export type HostApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Changes Requested'
  | 'Approved'
  | 'Rejected'

export type HostVerificationDocument = {
  id?: string
  document_type: string
  file: string
  document_number?: string
  expiry_date?: string | null
}

export type HostOrganizationData = {
  id: string
  display_name: string
  organization_type: string
  legal_name: string
  registration_number: string
  country: string
  city: string
  address: string
  email: string
  phone: string
  logo: string
  verification_status: HostVerificationStatus
}

export type HostApplicationData = {
  id: string
  applicant: string
  organization: string
  status: HostApplicationStatus
  submitted_at: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comment: string
  verification_documents: HostVerificationDocument[]
}

export type MyHostStatusResponse = {
  has_host_role: boolean
  is_admin: boolean
  organization: HostOrganizationData | null
  application: HostApplicationData | null
}

export type SubmitHostApplicationPayload = {
  display_name: string
  legal_name: string
  registration_number: string
  country?: string
  city: string
  address?: string
  phone: string
  email: string
  logo?: string
  verification_documents?: HostVerificationDocument[]
}

export type SubmitHostApplicationResponse = {
  success: boolean
  application_id: string
  organization_id: string
  status: HostApplicationStatus
  application: HostApplicationData
  organization: HostOrganizationData
  message: string
}

export type HostEventItem = {
  id: string
  title: string
  event_type: 'Master Class' | 'Tournament'
  description?: string
  cover?: string | null
  poster?: string | null
  start_datetime: string | null
  end_datetime: string | null
  venue?: string | null
  venue_title?: string | null
  city?: string | null
  venue_address?: string | null
  publication_status: string
  registration_status: string
  event_status: string
  currency: string
  master_class_id?: string | null
  tournament_id?: string | null
  slots_count: number
  packages_count: number
  registrations_count: number
  revenue: number
  slots: MasterClassSlotItem[]
  packages: MasterClassPackageItem[]
}

export type HostRegistrationItem = {
  id: string
  registration_type: 'Master Class' | 'Tournament'
  status: string
  registered_at: string
  event_id: string
  event_title: string
  item_label: string
  amount: number
  currency: string
  participant_id: string
  participant_name: string
  participant_phone: string
  participant_email: string
  participant_city: string
  participant_photo: string
  ticket_id?: string | null
  ticket_number?: string | null
  ticket_status?: string | null
  is_checked_in: boolean
  checked_in_at?: string | null
}

export type HostParticipantTicket = {
  ticket_id: string
  ticket_number: string
  event_title: string
  item_label: string
  is_checked_in: boolean
}

export type HostParticipantItem = {
  id: string
  full_name: string
  phone: string
  email: string
  city: string
  photo: string
  registrations_count: number
  total_spent: number
  events: string[]
  tickets: HostParticipantTicket[]
}

export type HostDashboardStats = {
  total_events: number
  active_events: number
  total_registrations: number
  paid_registrations: number
  total_participants: number
  total_revenue: number
  currency: string
}

export type HostDashboardData = {
  organization: HostOrganizationData
  stats: HostDashboardStats
  events: HostEventItem[]
  registrations: HostRegistrationItem[]
  participants: HostParticipantItem[]
  venues: VenueItem[]
}

export type CreateHostEventPayload = {
  event_type: 'Master Class' | 'Tournament'
  title: string
  description?: string
  cover?: string
  poster?: string
  venue?: string
  currency?: string
  // Master Class specific
  slots?: {
    client_key: string
    start_datetime: string
    end_datetime: string
    venue?: string
    has_capacity_limit: boolean | number
    capacity: number
    price: number
  }[]
  packages?: {
    title: string
    description?: string
    price: number
    slot_keys: string[]
  }[]
  // Tournament specific
  start_datetime?: string
  end_datetime?: string
  registration_rules?: string
  allow_solo?: boolean
  allow_couple?: boolean
  allow_team?: boolean
}

export type AdminHostApplicationItem = {
  id: string
  status: HostApplicationStatus
  submitted_at: string
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_comment: string
  applicant: {
    id: string
    full_name: string
    email: string
    phone: string
    city: string
    photo: string
  }
  organization: HostOrganizationData
  verification_documents: HostVerificationDocument[]
}

export type AdminHostApplicationsResponse = {
  counts: {
    all: number
    Submitted: number
    'Under Review': number
    'Changes Requested': number
    Approved: number
    Rejected: number
  }
  applications: AdminHostApplicationItem[]
}

export async function getMyHostStatus(): Promise<MyHostStatusResponse> {
  const res = await frappeFetch<FrappeResponse<MyHostStatusResponse>>(
    '/api/method/dance_platform.api.host_cabinet.get_my_host_status'
  )
  return res.message
}

export async function submitHostApplication(
  payload: SubmitHostApplicationPayload
): Promise<SubmitHostApplicationResponse> {
  const res = await frappeFetch<FrappeResponse<SubmitHostApplicationResponse>>(
    '/api/method/dance_platform.api.host_cabinet.submit_host_application',
    {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }
  )
  return res.message
}

export async function getHostDashboardData(): Promise<HostDashboardData> {
  const res = await frappeFetch<FrappeResponse<HostDashboardData>>(
    '/api/method/dance_platform.api.host_cabinet.get_host_dashboard_data'
  )
  return res.message
}

export async function updateHostOrganizationProfile(
  payload: Partial<HostOrganizationData>
): Promise<{ success: boolean; organization: HostOrganizationData; message: string }> {
  const res = await frappeFetch<
    FrappeResponse<{ success: boolean; organization: HostOrganizationData; message: string }>
  >('/api/method/dance_platform.api.host_cabinet.update_host_organization_profile', {
    method: 'POST',
    body: JSON.stringify({ payload }),
  })
  return res.message
}

export async function createHostEvent(
  payload: CreateHostEventPayload
): Promise<{ success: boolean; event_id: string; event_type: string; message: string }> {
  const res = await frappeFetch<
    FrappeResponse<{ success: boolean; event_id: string; event_type: string; message: string }>
  >('/api/method/dance_platform.api.host_cabinet.create_host_event', {
    method: 'POST',
    body: JSON.stringify({ payload }),
  })
  return res.message
}

export async function adminGetHostApplications(
  statusFilter?: string,
  searchQuery?: string
): Promise<AdminHostApplicationsResponse> {
  const params = new URLSearchParams()
  if (statusFilter) params.set('status_filter', statusFilter)
  if (searchQuery) params.set('search_query', searchQuery)
  const qs = params.toString()
  const res = await frappeFetch<FrappeResponse<AdminHostApplicationsResponse>>(
    `/api/method/dance_platform.api.host_cabinet.admin_get_host_applications${qs ? `?${qs}` : ''}`
  )
  return res.message
}

export async function adminReviewHostApplication(
  applicationId: string,
  action: 'approve' | 'request_changes' | 'reject' | 'under_review',
  reviewComment?: string
): Promise<{
  success: boolean
  application: HostApplicationData
  organization: HostOrganizationData
  message: string
}> {
  const res = await frappeFetch<
    FrappeResponse<{
      success: boolean
      application: HostApplicationData
      organization: HostOrganizationData
      message: string
    }>
  >('/api/method/dance_platform.api.host_cabinet.admin_review_host_application', {
    method: 'POST',
    body: JSON.stringify({
      application_id: applicationId,
      action,
      review_comment: reviewComment,
    }),
  })
  return res.message
}

