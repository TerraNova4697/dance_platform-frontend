export type EventType = 'tournament' | 'master_class'
export type Currency = 'KZT' | 'RUB' | 'USD' | 'EUR'
export type RegistrationStatus = 'not_open' | 'open' | 'closed' | 'unknown'
export type EventStatus = 'upcoming' | 'in_progress' | 'finished' | 'cancelled' | 'unknown'

export interface NamedEntity {
  id: string
  name: string
}

export interface EventVenue extends NamedEntity {
  city: string
  address: string
  latitude?: number
  longitude?: number
}

export interface EventScheduleItem {
  id: string
  title: string
  description?: string
  startAt: string
  endAt?: string
  location?: string
}

export interface EventPerson {
  id: string
  personId?: string
  name: string
  role: 'judge' | 'instructor' | 'speaker' | 'organizer'
  roleLabel?: string
  photoUrl?: string
}

export interface EventContact {
  id: string
  name?: string
  phone?: string
  email?: string
}

export interface EventPriceRule {
  id: string
  label: string
  description?: string
  price: number
  currency: string
  validFrom?: string
  validTo?: string
}

export interface EventDetails {
  id: string
  type: EventType
  title: string
  description: string
  coverUrl?: string
  posterUrl?: string
  host: NamedEntity & { logoUrl?: string; type?: string }
  startAt: string
  endAt?: string
  publicationStatus?: string
  registrationStatus: RegistrationStatus
  eventStatus: EventStatus
  registrationOpenAt?: string
  registrationCloseAt?: string
  venue: EventVenue
  directions: NamedEntity[]
  minimumPrice?: number
  currency: Currency
  schedule: EventScheduleItem[]
  people: EventPerson[]
  pricing: EventPriceRule[]
  packages: MasterClassPackage[]
  rules?: string
  contacts: EventContact[]
  spectatorTicketsAvailable: boolean
  currentUserState?: {
    registered: boolean
    ticketId?: string
    spectatorTicketOwned?: boolean
  }
}

export interface TournamentCategory {
  id: string
  discipline: NamedEntity
  category: NamedEntity
  ageFrom?: number
  ageTo?: number
  level?: NamedEntity
  league?: NamedEntity
  className?: string
  participationType: 'solo' | 'couple' | 'team' | 'formation'
  capacity?: number
  availabilityStatus: 'available' | 'low' | 'full'
  registrationStatus: RegistrationStatus
  price?: number
  currency?: string
}

export interface MasterClassSlot {
  id: string
  title?: string
  startAt: string
  endAt: string
  venue?: { id?: string; name: string }
  capacity?: number
  availablePlaces?: number
  availabilityStatus: 'available' | 'low' | 'full' | 'cancelled'
  price?: number
  currency?: string
}

export interface MasterClassPackage {
  id: string
  title: string
  description?: string
  price: number
  currency: string
}

export interface SpectatorTicketType {
  id: string
  title: string
  type: 'standard' | 'vip' | 'child' | 'day' | 'full_pass'
  price: number
  currency: string
  availabilityStatus: 'available' | 'low' | 'sold_out' | 'unavailable'
  salesStartAt?: string
  salesEndAt?: string
}
