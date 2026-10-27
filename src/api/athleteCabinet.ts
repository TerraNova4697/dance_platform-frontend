import { frappeFetch } from './frappe'

export type TrainerRelationItem = {
  id: string
  status: 'Pending' | 'Active' | 'Inactive' | 'Rejected'
  initiated_by?: 'Athlete' | 'Trainer'
  from_date?: string
  club?: string
  club_name?: string
  trainer_profile: string
  public_name: string
  city?: string
  verification_status?: string
  photo?: string
  phone?: string
}

export type ClubMembershipItem = {
  id: string
  club: string
  club_title: string
  club_city?: string
  club_logo?: string
  status: 'Pending' | 'Invited' | 'Active' | 'Left' | 'Rejected'
  joined_at?: string
  creation?: string
}

export type LeagueMembershipItem = {
  id: string
  league: string
  league_title: string
  status: 'Pending' | 'Active' | 'Rejected' | 'Left'
  joined_at?: string
  creation?: string
}

export type FederationMembershipItem = {
  id: string
  federation: string
  federation_title: string
  status: 'Pending' | 'Active' | 'Rejected' | 'Left'
  joined_at?: string
  creation?: string
}

export type AthleteCabinetData = {
  person: {
    name: string
    first_name: string
    last_name: string
    middle_name?: string
    date_of_birth?: string
    gender?: string
    phone?: string
    city?: string
    country?: string
    photo?: string
  }
  athlete: {
    name: string
    level?: string
    directions: string[]
  }
  trainers: {
    active: TrainerRelationItem[]
    incoming: TrainerRelationItem[]
    outgoing: TrainerRelationItem[]
  }
  clubs: {
    active: ClubMembershipItem[]
    invited: ClubMembershipItem[]
    outgoing: ClubMembershipItem[]
  }
  leagues: {
    active: LeagueMembershipItem[]
    outgoing: LeagueMembershipItem[]
  }
  federations: {
    active: FederationMembershipItem[]
    outgoing: FederationMembershipItem[]
  }
}

export type ClubSearchResult = {
  name: string
  title: string
  city?: string
  logo?: string
}

type FrappeResponse<T> = { message: T }

export async function getAthleteCabinetData(): Promise<AthleteCabinetData> {
  const res = await frappeFetch<FrappeResponse<AthleteCabinetData>>('/api/method/dance_platform.api.athlete_cabinet.get_athlete_cabinet_data')
  return res.message
}

export async function updateAthleteProfile(
  personData: {
    first_name: string
    last_name: string
    middle_name?: string
    date_of_birth: string
    gender?: string
    phone?: string
    city?: string
    country?: string
    photo?: string
  },
  athleteData: {
    level?: string
    directions?: string[]
  }
): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.update_athlete_profile',
    {
      method: 'POST',
      body: JSON.stringify({
        person_data: personData,
        athlete_data: athleteData,
      }),
    }
  )
  return res.message
}

export async function searchClubs(query: string): Promise<ClubSearchResult[]> {
  const res = await frappeFetch<FrappeResponse<ClubSearchResult[]>>(
    `/api/method/dance_platform.api.athlete_cabinet.search_clubs?query=${encodeURIComponent(query)}`
  )
  return res.message || []
}

export async function sendTrainerRequest(trainerProfile: string): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.send_trainer_request',
    {
      method: 'POST',
      body: JSON.stringify({ trainer_profile: trainerProfile }),
    }
  )
  return res.message
}

export async function respondTrainerRelation(
  relationId: string,
  action: 'accept' | 'reject' | 'cancel' | 'leave'
): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.respond_trainer_relation',
    {
      method: 'POST',
      body: JSON.stringify({ relation_id: relationId, action }),
    }
  )
  return res.message
}

export async function sendClubRequest(clubId: string): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.send_club_request',
    {
      method: 'POST',
      body: JSON.stringify({ club_id: clubId }),
    }
  )
  return res.message
}

export async function respondClubMembership(
  membershipId: string,
  action: 'accept' | 'reject' | 'cancel' | 'leave'
): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.respond_club_membership',
    {
      method: 'POST',
      body: JSON.stringify({ membership_id: membershipId, action }),
    }
  )
  return res.message
}

export async function sendLeagueRequest(leagueId: string): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.send_league_request',
    {
      method: 'POST',
      body: JSON.stringify({ league_id: leagueId }),
    }
  )
  return res.message
}

export async function respondLeagueMembership(
  membershipId: string,
  action: 'cancel' | 'leave'
): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.respond_league_membership',
    {
      method: 'POST',
      body: JSON.stringify({ membership_id: membershipId, action }),
    }
  )
  return res.message
}

export async function sendFederationRequest(federationId: string): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.send_federation_request',
    {
      method: 'POST',
      body: JSON.stringify({ federation_id: federationId }),
    }
  )
  return res.message
}

export async function respondFederationMembership(
  membershipId: string,
  action: 'cancel' | 'leave'
): Promise<{ success: boolean; message: string }> {
  const res = await frappeFetch<FrappeResponse<{ success: boolean; message: string }>>(
    '/api/method/dance_platform.api.athlete_cabinet.respond_federation_membership',
    {
      method: 'POST',
      body: JSON.stringify({ membership_id: membershipId, action }),
    }
  )
  return res.message
}
