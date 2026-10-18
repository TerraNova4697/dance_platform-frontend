import { frappeFetch, FrappeApiError } from './frappe'

type FrappeResponse<T> = { message: T }

export type OnboardingStatus = 'Pending' | 'Completed' | 'Skipped'
export type TrainerVerificationStatus = 'Pending' | 'Verified' | 'Rejected' | null

export type CatalogItem = {
  name: string
  title: string
}

export type ClubCatalogItem = {
  name: string
  club_name: string
  city?: string | null
}

export type TrainerCatalogItem = {
  name: string
  public_name: string
  city?: string | null
  verification_status?: TrainerVerificationStatus
}

export type OnboardingContext = {
  person: {
    name: string
    first_name: string
    last_name: string
    date_of_birth: string | null
    phone: string | null
    city: string | null
    country?: string | null
    photo: string | null
    onboarding_status: OnboardingStatus
  }
  roles: {
    is_athlete: boolean
    is_trainer: boolean
    trainer_verification_status: TrainerVerificationStatus
  }
  catalogs: {
    directions: CatalogItem[]
    levels: CatalogItem[]
    leagues: CatalogItem[]
    federations: CatalogItem[]
    clubs: ClubCatalogItem[]
    trainers: TrainerCatalogItem[]
  }
}

export type SubmitOnboardingPayload = {
  role: 'athlete' | 'trainer'
  person: {
    date_of_birth: string
    phone?: string | null
    city?: string | null
    country?: string | null
    photo?: string | null
  }
  athlete?: {
    directions?: string[]
    level?: string | null
    league?: string | null
    federation?: string | null
    clubs?: string[]
    trainers?: string[]
  }
  trainer?: {
    public_name: string
    city: string
    directions?: string[]
    clubs?: string[]
    experience?: string | null
    qualification?: string | null
    bio?: string | null
    default_training_duration?: number
    booking_enabled?: number
  }
}

export type SubmitOnboardingResult = {
  success: boolean
  onboarding_status: OnboardingStatus
  role: 'athlete' | 'trainer'
  verification_status: TrainerVerificationStatus
  message: string
}

export type SkipOnboardingResult = {
  success: boolean
  onboarding_status: OnboardingStatus
  message: string
}

export async function getOnboardingContext(): Promise<OnboardingContext> {
  const response = await frappeFetch<FrappeResponse<OnboardingContext>>(
    '/api/method/dance_platform.api.onboarding.get_onboarding_context'
  )
  return response.message
}

export async function submitOnboarding(payload: SubmitOnboardingPayload): Promise<SubmitOnboardingResult> {
  const response = await frappeFetch<FrappeResponse<SubmitOnboardingResult>>(
    '/api/method/dance_platform.api.onboarding.submit_onboarding',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
  return response.message
}

export async function skipOnboarding(): Promise<SkipOnboardingResult> {
  const response = await frappeFetch<FrappeResponse<SkipOnboardingResult>>(
    '/api/method/dance_platform.api.onboarding.skip_onboarding',
    {
      method: 'POST',
    }
  )
  return response.message
}

export async function uploadProfilePhoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('is_private', '0')

  const response = await frappeFetch<FrappeResponse<{ file_url: string }>>(
    '/api/method/upload_file',
    {
      method: 'POST',
      body: formData,
    }
  )
  return response.message.file_url
}

export async function searchLeagues(query: string): Promise<CatalogItem[]> {
  const params = new URLSearchParams({ query })
  const response = await frappeFetch<FrappeResponse<CatalogItem[]>>(
    `/api/method/dance_platform.api.onboarding.search_leagues?${params.toString()}`
  )
  return response.message || []
}

export async function searchFederations(query: string): Promise<CatalogItem[]> {
  const params = new URLSearchParams({ query })
  const response = await frappeFetch<FrappeResponse<CatalogItem[]>>(
    `/api/method/dance_platform.api.onboarding.search_federations?${params.toString()}`
  )
  return response.message || []
}

export type TrainerSearchResult = {
  name: string
  public_name: string
  city?: string | null
  verification_status?: TrainerVerificationStatus
  phone?: string | null
  photo?: string | null
}

export async function searchTrainerByPhone(phone: string): Promise<TrainerSearchResult | null> {
  const params = new URLSearchParams({ phone })
  try {
    const response = await frappeFetch<FrappeResponse<TrainerSearchResult>>(
      `/api/method/dance_platform.api.onboarding.search_trainer_by_phone?${params.toString()}`
    )
    return response.message
  } catch (err: unknown) {
    if (err instanceof FrappeApiError && err.status === 404) {
      return null
    }
    throw err
  }
}


