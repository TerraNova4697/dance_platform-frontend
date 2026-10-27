import { frappeFetch } from './frappe'
import type { AvailableTrainingSlot } from './booking'
import type { TrainerVerificationStatus } from './onboarding'

type FrappeResponse<T> = { message: T }

export type PublicTrainerSummary = {
  id: string
  public_name: string
  photo?: string | null
  city: string
  bio?: string | null
  experience_years: number
  verification_status: TrainerVerificationStatus
  upcoming_slots_count: number
  directions: string[]
}

export type PublicTrainerDetails = {
  id: string
  publicName: string
  photo?: string | null
  city: string
  bio?: string | null
  experienceYears: number
  verificationStatus: TrainerVerificationStatus
  directions: string[]
  slots: AvailableTrainingSlot[]
}

export type TrainingBookingDetails = {
  id: string
  status: string
  bookingDatetime: string
  slot: {
    id: string
    startAt: string
    endAt: string
    price: number
    currency: string
    status: string
  }
  offering: {
    id: string
    title: string
    description?: string | null
    trainingType: 'Individual' | 'Group'
    direction?: string | null
  }
  trainer: {
    id: string
    publicName: string
    photo?: string | null
    city?: string
    bio?: string | null
  }
  venue: {
    id?: string | null
    title: string
    city: string
    address: string
    latitude?: number | null
    longitude?: number | null
  }
  canCancel: boolean
}

export async function getPublicTrainers(params?: {
  city?: string
  direction?: string
  query?: string
}): Promise<PublicTrainerSummary[]> {
  const q = new URLSearchParams()
  if (params?.city) q.append('city', params.city)
  if (params?.direction) q.append('direction', params.direction)
  if (params?.query) q.append('query', params.query)

  const response = await frappeFetch<PublicTrainerSummary[] | FrappeResponse<PublicTrainerSummary[]>>(
    `/api/method/dance_platform.api.booking.get_public_trainers?${q.toString()}`
  )
  if (Array.isArray(response)) return response
  return (response as FrappeResponse<PublicTrainerSummary[]>).message || []
}

export async function getPublicTrainerDetails(trainerId: string): Promise<PublicTrainerDetails> {
  const response = await frappeFetch<PublicTrainerDetails | FrappeResponse<PublicTrainerDetails>>(
    `/api/method/dance_platform.api.booking.get_public_trainer_details?trainer_id=${encodeURIComponent(trainerId)}`
  )
  if ('publicName' in response) return response as PublicTrainerDetails
  return (response as FrappeResponse<PublicTrainerDetails>).message
}

export async function getTrainingBookingDetails(bookingId: string): Promise<TrainingBookingDetails> {
  const response = await frappeFetch<TrainingBookingDetails | FrappeResponse<TrainingBookingDetails>>(
    `/api/method/dance_platform.api.booking.get_training_booking_details?booking_id=${encodeURIComponent(bookingId)}`
  )
  if ('slot' in response) return response as TrainingBookingDetails
  return (response as FrappeResponse<TrainingBookingDetails>).message
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

