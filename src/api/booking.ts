import { frappeFetch } from './frappe'
import type { TrainerVerificationStatus } from './onboarding'

type FrappeResponse<T> = { message: T }

export type AvailableTrainingSlot = {
  id: string
  training_offering: string
  offering_title: string
  training_type: 'Individual' | 'Group'
  description?: string | null
  direction_title?: string | null
  start_datetime: string
  end_datetime: string
  venue?: string | null
  venue_title?: string | null
  venue_city?: string | null
  venue_address?: string | null
  has_capacity_limit: boolean | number
  capacity: number
  booked_count: number
  price: number
  currency: string
  status: string
  trainer_id: string
  trainer_name: string
  trainer_photo?: string | null
  trainer_verification_status: TrainerVerificationStatus
  schedule_type?: 'Single' | 'Recurring'
  package_size?: number
  package_price?: number
  available_places: number | null
  is_full: boolean
  is_already_booked?: boolean
}

export type BookingConflictItem = {
  activity_type: 'training' | 'master_class' | 'tournament'
  type_label: string
  title: string
  subtitle?: string
  start_datetime: string
  end_datetime: string
}

export type InitiateBookingResult = {
  success: boolean
  warning_required?: boolean
  conflicts?: BookingConflictItem[]
  existing_hold?: boolean
  booking_id?: string
  registration_id?: string
  checkout_session_id: string
  expires_at: string
  amount: number
  currency: string
  message: string
}

export async function getAvailableTrainingSlots(params?: {
  direction?: string
  city?: string
  trainerId?: string
  date?: string
}): Promise<AvailableTrainingSlot[]> {
  const query = new URLSearchParams()
  if (params?.direction) query.append('direction', params.direction)
  if (params?.city) query.append('city', params.city)
  if (params?.trainerId) query.append('trainer_id', params.trainerId)
  if (params?.date) query.append('date', params.date)

  const response = await frappeFetch<FrappeResponse<AvailableTrainingSlot[]>>(
    `/api/method/dance_platform.api.booking.get_available_training_slots?${query.toString()}`
  )
  return response.message || []
}

export async function initiateTrainingBooking(
  slotId: string,
  ignoreTimeConflict = false
): Promise<InitiateBookingResult> {
  const response = await frappeFetch<FrappeResponse<InitiateBookingResult>>(
    '/api/method/dance_platform.api.booking.initiate_training_booking',
    {
      method: 'POST',
      body: JSON.stringify({
        slot_id: slotId,
        ignore_time_conflict: ignoreTimeConflict ? 1 : 0,
      }),
    }
  )
  return response.message
}

export async function initiateMasterClassBooking(params: {
  masterClassId: string
  slotId?: string
  packageId?: string
  ignoreTimeConflict?: boolean
}): Promise<InitiateBookingResult> {
  const response = await frappeFetch<FrappeResponse<InitiateBookingResult>>(
    '/api/method/dance_platform.api.booking.initiate_master_class_booking',
    {
      method: 'POST',
      body: JSON.stringify({
        master_class_id: params.masterClassId,
        slot_id: params.slotId,
        package_id: params.packageId,
        ignore_time_conflict: params.ignoreTimeConflict ? 1 : 0,
      }),
    }
  )
  return response.message
}

export async function cancelTrainingBooking(bookingId: string): Promise<{ success: boolean; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.booking.cancel_training_booking',
    {
      method: 'POST',
      body: JSON.stringify({ booking_id: bookingId }),
    }
  )
  return response.message
}

export type ConfirmPaymentResult = {
  success: boolean
  message: string
  order_id?: string
  ticket_id?: string
  booking_id?: string
}

export async function confirmBookingPayment(checkoutSessionId: string): Promise<ConfirmPaymentResult> {
  const response = await frappeFetch<FrappeResponse<ConfirmPaymentResult>>(
    '/api/method/dance_platform.api.booking.confirm_booking_payment',
    {
      method: 'POST',
      body: JSON.stringify({ checkout_session_id: checkoutSessionId }),
    }
  )
  return response.message
}

export async function cancelBookingHold(checkoutSessionId: string): Promise<{ success: boolean; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.booking.cancel_booking_hold',
    {
      method: 'POST',
      body: JSON.stringify({ checkout_session_id: checkoutSessionId }),
    }
  )
  return response.message
}

export type TournamentRegistrationContext = {
  tournament: {
    id: string
    event_id: string
    event_title: string
    event_start_date?: string | null
    allow_solo: boolean
    allow_couple: boolean
    allow_team: boolean
    allow_formation?: boolean
    registration_rules?: string
  }
  athlete: {
    person_id: string
    athlete_id: string
    first_name: string
    last_name: string
    full_name: string
    date_of_birth: string
    age_on_event?: number | null
    dance_class: string
    level: string
    city: string
    club_id: string
    club_title: string
    trainer_id: string
    trainer_name: string
    federation_title: string
  }
  clubs: Array<{ id: string; title: string; city?: string }>
  trainers: Array<{ id: string; name: string; city?: string }>
  levels: string[]
  already_registered_category_ids: string[]
}

export type PartnerAthleteItem = {
  person_id: string
  first_name: string
  last_name: string
  full_name: string
  city: string
  date_of_birth: string
  age_on_event?: number | null
  dance_class: string
  level: string
  club_title?: string
}

export type TournamentPartnerInput = {
  mode: 'existing' | 'manual'
  person_id?: string
  first_name?: string
  last_name?: string
  date_of_birth?: string
  dance_class?: string
}

export type InitiateTournamentBookingPayload = {
  event_id: string
  participation_type: 'solo' | 'couple' | 'team' | 'formation'
  team_name?: string
  category_ids: string[]
  athlete_data: {
    first_name?: string
    last_name?: string
    date_of_birth: string
    dance_class: string
    level?: string
    club_id?: string
    trainer_id?: string
  }
  partners?: TournamentPartnerInput[]
  ignore_time_conflict?: boolean | number
}

export async function getTournamentRegistrationContext(eventId: string): Promise<TournamentRegistrationContext> {
  const response = await frappeFetch<FrappeResponse<TournamentRegistrationContext>>(
    `/api/method/dance_platform.api.booking.get_tournament_registration_context?event_id=${encodeURIComponent(eventId)}`
  )
  return response.message
}

export async function searchPartnerAthletes(query = '', eventId?: string): Promise<PartnerAthleteItem[]> {
  const params = new URLSearchParams()
  if (query) params.append('query', query)
  if (eventId) params.append('event_id', eventId)
  const response = await frappeFetch<FrappeResponse<PartnerAthleteItem[]>>(
    `/api/method/dance_platform.api.booking.search_partner_athletes?${params.toString()}`
  )
  return response.message || []
}

export async function initiateTournamentBooking(
  payload: InitiateTournamentBookingPayload
): Promise<InitiateBookingResult> {
  const response = await frappeFetch<FrappeResponse<InitiateBookingResult>>(
    '/api/method/dance_platform.api.booking.initiate_tournament_booking',
    {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }
  )
  return response.message
}


