import { frappeFetch, FrappeApiError } from './frappe'
import type { CatalogItem, ClubCatalogItem, TrainerVerificationStatus } from './onboarding'

type FrappeResponse<T> = { message: T }

export type CabinetPerson = {
  name: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  phone: string | null
  city: string | null
  country?: string | null
  photo: string | null
  onboarding_status: string
}

export type CabinetTrainerProfile = {
  name: string
  public_name: string
  city?: string | null
  bio?: string | null
  experience?: string | null
  qualification?: string | null
  photo?: string | null
  default_training_duration: number
  booking_enabled: boolean
  verification_status: TrainerVerificationStatus
  verified_at?: string | null
  directions: string[]
  clubs: { club: string; status: string }[]
}

export type CabinetAthleteProfile = {
  name: string
  level?: string | null
  league?: string | null
  federation?: string | null
  directions: string[]
  clubs: { club: string; status: string }[]
}

export type CabinetContext = {
  person: CabinetPerson
  roles: {
    is_trainer: boolean
    is_athlete: boolean
    trainer_verification_status: TrainerVerificationStatus
  }
  trainer: CabinetTrainerProfile | null
  athlete: CabinetAthleteProfile | null
  catalogs: {
    directions: CatalogItem[]
    levels: CatalogItem[]
    clubs: ClubCatalogItem[]
  }
}

export type AthleteSearchResult = {
  athlete_profile: string
  person_name: string
  full_name: string
  photo?: string | null
  city?: string | null
  phone?: string | null
}

export type StudentRelationItem = {
  id: string
  status: 'Pending' | 'Active' | 'Inactive' | 'Rejected'
  initiated_by: 'Athlete' | 'Trainer'
  from_date?: string | null
  club?: string | null
  club_name?: string | null
  athlete_profile?: string
  person_name?: string
  full_name?: string
  photo?: string | null
  city?: string | null
  phone?: string | null
  // for athlete viewing trainer
  trainer_profile?: string
  public_name?: string
  verification_status?: TrainerVerificationStatus
}

export type TrainerStudentsResponse = {
  active_students: StudentRelationItem[]
  incoming_requests: StudentRelationItem[]
  outgoing_requests: StudentRelationItem[]
  active_trainers_for_athlete: StudentRelationItem[]
  incoming_trainer_requests_for_athlete: StudentRelationItem[]
}

export type VenueItem = {
  name: string
  title: string
  city?: string | null
  address?: string | null
}

export type TrainingOfferingItem = {
  id: string
  title: string
  training_type: 'Individual' | 'Group'
  direction: string
  direction_title?: string
  discipline?: string | null
  description?: string | null
  duration_minutes: number
  has_capacity_limit: boolean | number
  capacity: number
  price: number
  currency: string
  default_venue?: string | null
  default_venue_title?: string | null
  active: boolean | number
}

export type TrainingSlotItem = {
  id: string
  training_offering: string
  offering_title: string
  training_type: 'Individual' | 'Group'
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
  status: 'Available' | 'Full' | 'Cancelled' | 'Completed'
  participants?: {
    slot: string
    booking_id: string
    status: string
    person_name: string
    participant_name: string
    phone?: string | null
    photo?: string | null
  }[]
}

export type TrainerTrainingsResponse = {
  offerings: TrainingOfferingItem[]
  rules: {
    name: string
    training_offering: string
    weekday: string
    start_time: string
    end_time: string
    valid_from: string
    valid_to: string
    slot_duration: number
  }[]
  slots: TrainingSlotItem[]
}

export type MasterClassSlotItem = {
  id?: string
  client_key?: string
  start_datetime: string
  end_datetime: string
  venue?: string | null
  venue_title?: string | null
  has_capacity_limit: boolean | number
  capacity: number
  booked_count?: number
  price: number
}

export type MasterClassPackageItem = {
  id?: string
  title: string
  description?: string
  price: number
  currency?: string
  slot_keys?: string[]
}

export type TrainerMasterClassEvent = {
  id: string
  title: string
  description?: string
  cover?: string | null
  poster?: string | null
  start_datetime: string
  end_datetime: string
  venue?: string | null
  venue_title?: string | null
  venue_city?: string | null
  venue_address?: string | null
  publication_status: string
  registration_status: string
  currency: string
  master_class_id: string
  slots: MasterClassSlotItem[]
  packages: MasterClassPackageItem[]
}

export async function getCabinetContext(): Promise<CabinetContext> {
  const response = await frappeFetch<FrappeResponse<CabinetContext>>(
    '/api/method/dance_platform.api.trainer_cabinet.get_cabinet_context'
  )
  return response.message
}

export async function updateTrainerProfile(payload: {
  person_data?: Record<string, unknown>
  trainer_data?: Record<string, unknown>
}): Promise<{ success: boolean; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.trainer_cabinet.update_trainer_profile',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
  return response.message
}

export async function activateSecondaryRole(role: 'trainer' | 'athlete'): Promise<{ success: boolean; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.trainer_cabinet.activate_secondary_role',
    {
      method: 'POST',
      body: JSON.stringify({ role }),
    }
  )
  return response.message
}

export async function searchAthleteByPhone(phone: string): Promise<AthleteSearchResult | null> {
  const params = new URLSearchParams({ phone })
  try {
    const response = await frappeFetch<FrappeResponse<AthleteSearchResult>>(
      `/api/method/dance_platform.api.trainer_cabinet.search_athlete_by_phone?${params.toString()}`
    )
    return response.message
  } catch (err: unknown) {
    if (err instanceof FrappeApiError && err.status === 404) {
      return null
    }
    throw err
  }
}

export async function getTrainerStudents(): Promise<TrainerStudentsResponse> {
  const response = await frappeFetch<FrappeResponse<TrainerStudentsResponse>>(
    '/api/method/dance_platform.api.trainer_cabinet.get_trainer_students'
  )
  return response.message
}

export async function sendStudentRequest(
  athleteProfile: string,
  club?: string
): Promise<{ success: boolean; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.trainer_cabinet.send_student_request',
    {
      method: 'POST',
      body: JSON.stringify({ athlete_profile: athleteProfile, club }),
    }
  )
  return response.message
}

export async function respondStudentRequest(
  relationId: string,
  action: 'accept' | 'reject' | 'remove' | 'cancel'
): Promise<{ success: boolean; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.trainer_cabinet.respond_student_request',
    {
      method: 'POST',
      body: JSON.stringify({ relation_id: relationId, action }),
    }
  )
  return response.message
}

export async function searchVenues(query: string): Promise<VenueItem[]> {
  const params = new URLSearchParams({ query })
  const response = await frappeFetch<FrappeResponse<VenueItem[]>>(
    `/api/method/dance_platform.api.trainer_cabinet.search_venues?${params.toString()}`
  )
  return response.message || []
}

export async function getTrainerTrainings(): Promise<TrainerTrainingsResponse> {
  const response = await frappeFetch<FrappeResponse<TrainerTrainingsResponse>>(
    '/api/method/dance_platform.api.trainer_cabinet.get_trainer_trainings'
  )
  return response.message
}

export async function saveTrainingOffering(
  offering: Partial<TrainingOfferingItem>
): Promise<{ success: boolean; offering: TrainingOfferingItem; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; offering: TrainingOfferingItem; message: string }>>(
    '/api/method/dance_platform.api.trainer_cabinet.save_training_offering',
    {
      method: 'POST',
      body: JSON.stringify({ offering }),
    }
  )
  return response.message
}

export type CreateSlotsPayload = {
  training_offering: string
  mode: 'single' | 'recurring'
  start_datetime?: string
  end_datetime?: string
  duration_minutes?: number
  has_capacity_limit?: boolean | number
  capacity?: number
  venue?: string
  price?: number
  currency?: string
  weekdays?: string[]
  start_time?: string
  valid_from?: string
  valid_to?: string
}

export async function createTrainingSlots(payload: CreateSlotsPayload): Promise<{ success: boolean; count: number; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; count: number; message: string }>>(
    '/api/method/dance_platform.api.trainer_cabinet.create_training_slots',
    {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }
  )
  return response.message
}

export async function getTrainerMasterClasses(): Promise<TrainerMasterClassEvent[]> {
  const response = await frappeFetch<FrappeResponse<TrainerMasterClassEvent[]>>(
    '/api/method/dance_platform.api.trainer_cabinet.get_trainer_master_classes'
  )
  return response.message || []
}

export type CreateMasterClassPayload = {
  title: string
  description?: string
  cover?: string
  poster?: string
  venue?: string
  currency?: string
  slots: {
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
}

export async function createMasterClass(
  payload: CreateMasterClassPayload
): Promise<{ success: boolean; event_id: string; master_class_id: string; message: string }> {
  const response = await frappeFetch<FrappeResponse<{ success: boolean; event_id: string; master_class_id: string; message: string }>>(
    '/api/method/dance_platform.api.trainer_cabinet.create_master_class',
    {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }
  )
  return response.message
}

