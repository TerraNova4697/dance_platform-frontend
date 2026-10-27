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
  available_places: number | null
  is_full: boolean
}

export type InitiateBookingResult = {
  success: boolean
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
}): Promise<AvailableTrainingSlot[]> {
  const query = new URLSearchParams()
  if (params?.direction) query.append('direction', params.direction)
  if (params?.city) query.append('city', params.city)
  if (params?.trainerId) query.append('trainer_id', params.trainerId)

  const response = await frappeFetch<FrappeResponse<AvailableTrainingSlot[]>>(
    `/api/method/dance_platform.api.booking.get_available_training_slots?${query.toString()}`
  )
  return response.message || []
}

export async function initiateTrainingBooking(slotId: string): Promise<InitiateBookingResult> {
  const response = await frappeFetch<FrappeResponse<InitiateBookingResult>>(
    '/api/method/dance_platform.api.booking.initiate_training_booking',
    {
      method: 'POST',
      body: JSON.stringify({ slot_id: slotId }),
    }
  )
  return response.message
}

export async function initiateMasterClassBooking(params: {
  masterClassId: string
  slotId?: string
  packageId?: string
}): Promise<InitiateBookingResult> {
  const response = await frappeFetch<FrappeResponse<InitiateBookingResult>>(
    '/api/method/dance_platform.api.booking.initiate_master_class_booking',
    {
      method: 'POST',
      body: JSON.stringify({
        master_class_id: params.masterClassId,
        slot_id: params.slotId,
        package_id: params.packageId,
      }),
    }
  )
  return response.message
}

export async function confirmBookingPayment(checkoutSessionId: string): Promise<{ success: boolean; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
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

