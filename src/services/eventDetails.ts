import {
  fetchEventDetails,
  fetchMasterClassSlots,
  fetchSpectatorTicketTypes,
  fetchTournamentCategories,
  fetchVenue,
} from '../api/eventDetails'
import type {
  Currency,
  EventContact,
  EventDetails,
  EventPerson,
  EventPriceRule,
  EventScheduleItem,
  EventStatus,
  EventVenue,
  MasterClassPackage,
  MasterClassSlot,
  NamedEntity,
  RegistrationStatus,
  SpectatorTicketType,
  TournamentCategory,
} from '../types/eventDetails'

type UnknownRecord = Record<string, unknown>

export class InvalidEventDetailsError extends Error {
  constructor(message = 'Backend вернул неполные данные Ивента') {
    super(message)
    this.name = 'InvalidEventDetailsError'
  }
}

function record(value: unknown): UnknownRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as UnknownRecord : undefined
}

function value(source: UnknownRecord | undefined, ...keys: string[]): unknown {
  for (const key of keys) {
    if (source?.[key] !== undefined && source[key] !== null) return source[key]
  }
  return undefined
}

function text(source: UnknownRecord | undefined, ...keys: string[]): string | undefined {
  const result = value(source, ...keys)
  return typeof result === 'string' && result.trim() ? result.trim() : undefined
}

function numberValue(source: UnknownRecord | undefined, ...keys: string[]): number | undefined {
  const result = value(source, ...keys)
  if (typeof result === 'number' && Number.isFinite(result)) return result
  if (typeof result === 'string' && result.trim()) {
    const parsed = Number(result)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function booleanValue(source: UnknownRecord | undefined, ...keys: string[]): boolean | undefined {
  const result = value(source, ...keys)
  if (typeof result === 'boolean') return result
  if (result === 1 || result === '1' || result === 'true') return true
  if (result === 0 || result === '0' || result === 'false') return false
  return undefined
}

function unwrap(payload: unknown): unknown {
  const outer = record(payload)
  return outer && 'message' in outer ? outer.message : payload
}

function objectPayload(payload: unknown, ...keys: string[]): UnknownRecord | undefined {
  const unwrapped = unwrap(payload)
  const source = record(unwrapped)
  for (const key of keys) {
    const nested = record(source?.[key])
    if (nested) return nested
  }
  return source
}

function listPayload(payload: unknown, ...keys: string[]): unknown[] {
  const unwrapped = unwrap(payload)
  if (Array.isArray(unwrapped)) return unwrapped
  const source = record(unwrapped)
  for (const key of ['items', 'data', ...keys]) {
    if (Array.isArray(source?.[key])) return source[key]
  }
  return []
}

function dateValue(source: UnknownRecord | undefined, ...keys: string[]): string | undefined {
  const result = text(source, ...keys)
  return result ? (result.includes('T') ? result : result.replace(' ', 'T')) : undefined
}

function entity(input: unknown, fallbackName = ''): NamedEntity {
  if (typeof input === 'string') return { id: input, name: fallbackName || input }
  const source = record(input)
  return {
    id: text(source, 'id', 'name', 'value') ?? '',
    name: text(source, 'display_name', 'displayName', 'title', 'label', 'name') ?? fallbackName,
  }
}

function entityList(input: unknown): NamedEntity[] {
  if (!Array.isArray(input)) return []
  return input.map((item) => entity(item)).filter((item) => item.name)
}

function currency(source: UnknownRecord | undefined, fallback = 'KZT'): Currency {
  const result = (text(source, 'currency') ?? fallback).toUpperCase()
  return ['KZT', 'RUB', 'USD', 'EUR'].includes(result) ? result as Currency : 'KZT'
}

function registrationStatus(source: UnknownRecord | undefined): RegistrationStatus {
  const result = text(source, 'registration_status', 'registrationStatus')?.toLowerCase().replace('registration_', '')
  return result === 'open' || result === 'closed' || result === 'not_open' ? result : 'unknown'
}

function eventStatus(source: UnknownRecord | undefined): EventStatus {
  const result = text(source, 'event_status', 'eventStatus', 'status')?.toLowerCase()
  return result === 'upcoming' || result === 'in_progress' || result === 'finished' || result === 'cancelled' ? result : 'unknown'
}

function normalizeVenue(input: unknown, parent?: UnknownRecord): EventVenue {
  const source = record(input)
  const base = entity(input, text(parent, 'venue_name', 'venueName') ?? '')
  return {
    ...base,
    id: base.id || (text(parent, 'venue_id', 'venueId', 'venue') ?? ''),
    name: base.name || (text(parent, 'venue_name', 'venueName') ?? ''),
    city: text(source, 'city', 'city_name', 'cityName') ?? text(parent, 'city', 'city_name', 'cityName') ?? '',
    address: text(source, 'address', 'full_address', 'fullAddress') ?? text(parent, 'address', 'venue_address', 'venueAddress') ?? '',
    latitude: numberValue(source, 'latitude', 'lat') ?? numberValue(parent, 'latitude', 'lat'),
    longitude: numberValue(source, 'longitude', 'lng', 'lon') ?? numberValue(parent, 'longitude', 'lng', 'lon'),
  }
}

function normalizeSchedule(input: unknown): EventScheduleItem[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((item, index) => {
    const source = record(item)
    const startAt = dateValue(source, 'start_at', 'startAt', 'start_datetime', 'startDatetime')
    const title = text(source, 'title', 'name', 'label')
    if (!source || !startAt || !title) return []
    return [{
      id: text(source, 'id', 'name') ?? `schedule-${index}`,
      title,
      description: text(source, 'description'),
      startAt,
      endAt: dateValue(source, 'end_at', 'endAt', 'end_datetime', 'endDatetime'),
      location: text(source, 'location', 'venue_name', 'venueName'),
    }]
  })
}

function normalizePeople(input: unknown): EventPerson[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((item, index) => {
    const source = record(item)
    const name = text(source, 'display_name', 'displayName', 'full_name', 'fullName', 'name')
    if (!source || !name) return []
    const rawRole = text(source, 'role')?.toLowerCase()
    const role: EventPerson['role'] = rawRole === 'judge' || rawRole === 'instructor' || rawRole === 'speaker' || rawRole === 'organizer' ? rawRole : 'speaker'
    return [{ id: text(source, 'id') ?? `person-${index}`, personId: text(source, 'person_id', 'personId'), name, role, roleLabel: text(source, 'role_label', 'roleLabel', 'position'), photoUrl: text(source, 'photo_url', 'photoUrl', 'photo') }]
  })
}

function normalizeContacts(input: unknown): EventContact[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((item, index) => {
    const source = record(item)
    if (!source) return []
    const contact = { id: text(source, 'id') ?? `contact-${index}`, name: text(source, 'name', 'contact_name', 'contactName', 'value'), phone: text(source, 'phone'), email: text(source, 'email') }
    return contact.name || contact.phone || contact.email ? [contact] : []
  })
}

function normalizePricing(input: unknown, fallbackCurrency: Currency): EventPriceRule[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((item, index) => {
    const source = record(item)
    const price = numberValue(source, 'price', 'amount')
    if (!source || price === undefined) return []
    return [{ id: text(source, 'id', 'name') ?? `price-${index}`, label: text(source, 'label', 'title', 'name') ?? 'Стоимость участия', description: text(source, 'description'), price, currency: text(source, 'currency') ?? fallbackCurrency, validFrom: dateValue(source, 'valid_from', 'validFrom'), validTo: dateValue(source, 'valid_to', 'validTo') }]
  })
}

function normalizePackages(input: unknown): MasterClassPackage[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((item, index) => {
    const source = record(item)
    const title = text(source, 'title', 'name')
    const price = numberValue(source, 'price')
    if (!source || !title || price === undefined) return []
    return [{ id: text(source, 'id') ?? 'package-' + index, title, description: text(source, 'description'), price, currency: text(source, 'currency') ?? 'KZT' }]
  })
}

export async function getEventDetails(eventId: string): Promise<EventDetails> {
  const source = objectPayload(await fetchEventDetails(eventId), 'event', 'details')
  if (!source || booleanValue(source, 'found') === false) throw new InvalidEventDetailsError('Ивент не найден')
  const title = text(source, 'title', 'event_title', 'eventTitle')
  const startAt = dateValue(source, 'start_at', 'startAt', 'start_datetime', 'startDatetime')
  const rawType = text(source, 'type', 'event_type', 'eventType')?.toLowerCase().replace(/[ -]/g, '_')
  if (!title || !startAt || (rawType !== 'tournament' && rawType !== 'master_class')) throw new InvalidEventDetailsError()
  const priceSource = record(value(source, 'price'))
  const masterClassSource = record(value(source, 'master_class', 'masterClass'))
  const eventCurrency = currency(priceSource, text(source, 'currency') ?? 'KZT')
  const hostSource = value(source, 'host', 'organizer')
  const hostEntity = entity(hostSource, text(source, 'host_name', 'hostName', 'organizer_name', 'organizerName') ?? '')
  const hostRecord = record(hostSource)
  const currentState = record(value(source, 'current_user_state', 'currentUserState'))

  return {
    id: text(source, 'id', 'name', 'event_id', 'eventId') ?? eventId,
    type: rawType,
    title,
    description: text(source, 'description') ?? '',
    coverUrl: text(source, 'cover_url', 'coverUrl', 'cover'),
    posterUrl: text(source, 'poster_url', 'posterUrl', 'poster'),
    host: { ...hostEntity, logoUrl: text(hostRecord, 'logo_url', 'logoUrl', 'logo'), type: text(hostRecord, 'type', 'organization_type', 'organizationType') },
    startAt,
    endAt: dateValue(source, 'end_at', 'endAt', 'end_datetime', 'endDatetime'),
    publicationStatus: text(source, 'publication_status', 'publicationStatus'),
    registrationStatus: registrationStatus(source),
    eventStatus: eventStatus(source),
    registrationOpenAt: dateValue(source, 'registration_open_at', 'registrationOpenAt'),
    registrationCloseAt: dateValue(source, 'registration_close_at', 'registrationCloseAt'),
    venue: normalizeVenue(value(source, 'venue'), source),
    directions: entityList(value(source, 'directions')),
    minimumPrice: numberValue(priceSource, 'minimum', 'minimum_price', 'minimumPrice') ?? numberValue(source, 'minimum_price', 'minimumPrice'),
    currency: eventCurrency,
    schedule: normalizeSchedule(value(source, 'schedule')),
    people: normalizePeople(value(source, 'people', 'judges', 'instructors')),
    pricing: normalizePricing(value(source, 'pricing', 'price_rules', 'priceRules'), eventCurrency),
    packages: normalizePackages(value(masterClassSource, 'packages')),
    rules: text(source, 'rules'),
    contacts: normalizeContacts(value(source, 'contacts')),
    spectatorTicketsAvailable: booleanValue(source, 'spectator_tickets_available', 'spectatorTicketsAvailable') ?? false,
    currentUserState: currentState ? { registered: booleanValue(currentState, 'registered') ?? false, ticketId: text(currentState, 'ticket_id', 'ticketId'), spectatorTicketOwned: booleanValue(currentState, 'spectator_ticket_owned', 'spectatorTicketOwned') } : undefined,
  }
}

export async function getVenue(venueId: string): Promise<EventVenue> {
  const source = objectPayload(await fetchVenue(venueId), 'venue')
  if (!source) throw new InvalidEventDetailsError('Место проведения не найдено')
  return normalizeVenue(source)
}

export async function getTournamentCategories(eventId: string): Promise<TournamentCategory[]> {
  return listPayload(await fetchTournamentCategories(eventId), 'categories').flatMap((item, index) => {
    const source = record(item)
    if (!source) return []
    const rawParticipation = text(source, 'participation_type', 'participationType')?.toLowerCase()
    const participationType: TournamentCategory['participationType'] = rawParticipation === 'couple' || rawParticipation === 'team' || rawParticipation === 'formation' ? rawParticipation : 'solo'
    const rawAvailability = text(source, 'availability_status', 'availabilityStatus')?.toLowerCase()
    const availabilityStatus: TournamentCategory['availabilityStatus'] = rawAvailability === 'low' || rawAvailability === 'full' ? rawAvailability : 'available'
    return [{ id: text(source, 'id', 'name') ?? `category-${index}`, discipline: entity(value(source, 'discipline')), category: entity(value(source, 'category')), ageFrom: numberValue(source, 'age_from', 'ageFrom'), ageTo: numberValue(source, 'age_to', 'ageTo'), level: value(source, 'level') ? entity(value(source, 'level')) : undefined, league: value(source, 'league') ? entity(value(source, 'league')) : undefined, className: text(source, 'class_name', 'className'), participationType, capacity: numberValue(source, 'capacity'), availabilityStatus, registrationStatus: registrationStatus(source), price: numberValue(source, 'price'), currency: text(source, 'currency') }]
  })
}

export async function getMasterClassSlots(eventId: string): Promise<MasterClassSlot[]> {
  return listPayload(await fetchMasterClassSlots(eventId), 'slots').flatMap((item, index) => {
    const source = record(item)
    const startAt = dateValue(source, 'start_at', 'startAt', 'start_datetime', 'startDatetime')
    const endAt = dateValue(source, 'end_at', 'endAt', 'end_datetime', 'endDatetime')
    if (!source || !startAt || !endAt) return []
    const rawAvailability = text(source, 'availability_status', 'availabilityStatus', 'status')?.toLowerCase()
    const availabilityStatus: MasterClassSlot['availabilityStatus'] = rawAvailability === 'low' || rawAvailability === 'full' || rawAvailability === 'cancelled' ? rawAvailability : 'available'
    const slotVenue = value(source, 'venue')
    const venueEntity = slotVenue ? entity(slotVenue) : undefined
    return [{ id: text(source, 'id', 'name') ?? `slot-${index}`, title: text(source, 'title'), startAt, endAt, venue: venueEntity?.name ? venueEntity : undefined, capacity: numberValue(source, 'capacity'), availablePlaces: numberValue(source, 'available_places', 'availablePlaces'), availabilityStatus, price: numberValue(source, 'price'), currency: text(source, 'currency') }]
  })
}

export async function getSpectatorTicketTypes(eventId: string): Promise<SpectatorTicketType[]> {
  return listPayload(await fetchSpectatorTicketTypes(eventId), 'ticket_types', 'ticketTypes').flatMap((item, index) => {
    const source = record(item)
    const title = text(source, 'title', 'name')
    const price = numberValue(source, 'price')
    if (!source || !title || price === undefined) return []
    const rawType = text(source, 'type')?.toLowerCase()
    const type: SpectatorTicketType['type'] = rawType === 'vip' || rawType === 'child' || rawType === 'day' || rawType === 'full_pass' ? rawType : 'standard'
    const rawAvailability = text(source, 'availability_status', 'availabilityStatus')?.toLowerCase()
    const availabilityStatus: SpectatorTicketType['availabilityStatus'] = rawAvailability === 'low' || rawAvailability === 'unavailable' ? rawAvailability : rawAvailability === 'sold_out' || rawAvailability === 'full' ? 'sold_out' : 'available'
    return [{ id: text(source, 'id') ?? `ticket-${index}`, title, type, price, currency: text(source, 'currency') ?? 'KZT', availabilityStatus, salesStartAt: dateValue(source, 'sales_start_at', 'salesStartAt'), salesEndAt: dateValue(source, 'sales_end_at', 'salesEndAt') }]
  })
}
