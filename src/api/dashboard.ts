import { frappeFetch, getResourceList, type FrappeFilter } from './frappe'

export type DanceEventRecord = {
  name: string; event_type: string; host: string; title: string; cover?: string; venue?: string
  start_datetime: string; end_datetime: string; publication_status?: string; event_status?: string
  currency?: string; is_published?: 0 | 1
}
export type VenueRecord = { name: string; title: string; city: string }
export type HostRecord = { name: string; display_name: string; city?: string }
export type EventPriceRecord = { name: string; event: string; price: number; currency: string; active?: 0 | 1 }
export type DanceTicketRecord = { name: string; event: string; guest_email?: string; person?: string; status?: string }
export type TournamentRecord = { name: string; event: string }
export type TournamentRegistrationRecord = { name: string; tournament: string; registered_by: string; participation_type: string; status?: string }
export type TournamentEntryRecord = { name: string; registration: string; tournament_category: string; status?: string }
export type TournamentCategoryRecord = { name: string; tournament: string; discipline: string; category: string; level?: string; participation_type: string }
export type MasterClassRecord = { name: string; event: string }
export type MasterRegistrationRecord = { name: string; master_class: string; slot?: string; package?: string; registered_by: string; status?: string }
export type MasterSlotRecord = { name: string; master_class: string; start_datetime: string; end_datetime: string; venue?: string; status?: string }
export type MasterPackageRecord = { name: string; master_class: string; title: string }
export type TrainingBookingRecord = { name: string; slot: string; participant: string; booked_by: string; status?: string }
export type TrainingSlotRecord = { name: string; training_offering: string; trainer: string; start_datetime: string; end_datetime: string; venue?: string; status?: string }
export type TrainingOfferingRecord = { name: string; trainer: string; title: string; direction: string; default_venue?: string }
export type AthleteDashboardProfileRecord = { id: string; firstName: string; avatarUrl?: string | null; city?: string | null }
export type NextActivityRecord = { id: string; type: 'tournament' | 'master_class' | 'training'; title: string; startAt: string; endAt?: string; venueName?: string; secondaryInfo?: string; status: string; ticketId?: string }

function byIds(field: string, ids: string[]): FrappeFilter[] {
  return ids.length ? [[field, 'in', [...new Set(ids)]]] : [[field, 'in', []]]
}

export const dashboardApi = {
  async athleteProfile(userId: string) {
    const query = new URLSearchParams({ user_id: userId })
    const response = await frappeFetch<AthleteDashboardProfileRecord | { message: AthleteDashboardProfileRecord }>(`/api/method/dance_platform.api.athlete_dashboard_profile.get_athlete_dashboard_profile?${query}`)
    return 'message' in response ? response.message : response
  },
  async nextActivity(userId: string) {
    const query = new URLSearchParams({ user_id: userId })
    const response = await frappeFetch<NextActivityRecord | null | { message: NextActivityRecord | null }>(`/api/method/dance_platform.api.athlete_dashboard_profile.get_next_activity?${query}`)
    if (response && 'message' in response) return response.message
    return response
  },
  events(filters: FrappeFilter[] = [], limit = 100) {
    return getResourceList<DanceEventRecord>('Dance Event', { fields: ['name', 'event_type', 'host', 'title', 'cover', 'venue', 'start_datetime', 'end_datetime', 'publication_status', 'event_status', 'currency', 'is_published'], filters, orderBy: 'start_datetime asc', limit })
  },
  eventsByIds(ids: string[]) { return this.events(byIds('name', ids)) },
  venues(ids: string[]) { return getResourceList<VenueRecord>('Venue', { fields: ['name', 'title', 'city'], filters: byIds('name', ids) }) },
  hosts(ids: string[]) { return getResourceList<HostRecord>('Host Organization', { fields: ['name', 'display_name', 'city'], filters: byIds('name', ids) }) },
  prices(eventIds: string[]) { return getResourceList<EventPriceRecord>('Event Pricing Rule', { fields: ['name', 'event', 'price', 'currency', 'active'], filters: [...byIds('event', eventIds), ['active', '=', 1]], orderBy: 'price asc' }) },
  tickets(userId: string, eventIds: string[]) { return getResourceList<DanceTicketRecord>('Dance Ticket', { fields: ['name', 'event', 'guest_email', 'person', 'status'], filters: [['guest_email', '=', userId], ...byIds('event', eventIds)] }) },
  tournamentsByIds(ids: string[]) { return getResourceList<TournamentRecord>('Tournament', { fields: ['name', 'event'], filters: byIds('name', ids) }) },
  tournamentsByEvents(eventIds: string[]) { return getResourceList<TournamentRecord>('Tournament', { fields: ['name', 'event'], filters: byIds('event', eventIds) }) },
  tournamentRegistrations(userId: string) { return getResourceList<TournamentRegistrationRecord>('Tournament Registration', { fields: ['name', 'tournament', 'registered_by', 'participation_type', 'status'], filters: [['registered_by', '=', userId]], limit: 50 }) },
  tournamentEntries(registrationIds: string[]) { return getResourceList<TournamentEntryRecord>('Tournament Entry', { fields: ['name', 'registration', 'tournament_category', 'status'], filters: byIds('registration', registrationIds) }) },
  tournamentCategories(ids: string[]) { return getResourceList<TournamentCategoryRecord>('Tournament Category', { fields: ['name', 'tournament', 'discipline', 'category', 'level', 'participation_type'], filters: byIds('name', ids) }) },
  tournamentCategoriesByTournaments(ids: string[]) { return getResourceList<TournamentCategoryRecord>('Tournament Category', { fields: ['name', 'tournament', 'discipline', 'category', 'level', 'participation_type'], filters: byIds('tournament', ids), limit: 200 }) },
  masterClassesByIds(ids: string[]) { return getResourceList<MasterClassRecord>('Master Class', { fields: ['name', 'event'], filters: byIds('name', ids) }) },
  masterClassesByEvents(ids: string[]) { return getResourceList<MasterClassRecord>('Master Class', { fields: ['name', 'event'], filters: byIds('event', ids) }) },
  masterRegistrations(userId: string) { return getResourceList<MasterRegistrationRecord>('Master Class Registration', { fields: ['name', 'master_class', 'slot', 'package', 'registered_by', 'status'], filters: [['registered_by', '=', userId]], limit: 50 }) },
  masterSlots(ids: string[]) { return getResourceList<MasterSlotRecord>('Master Class Slot', { fields: ['name', 'master_class', 'start_datetime', 'end_datetime', 'venue', 'status'], filters: byIds('name', ids) }) },
  masterPackages(ids: string[]) { return getResourceList<MasterPackageRecord>('Master Class Package', { fields: ['name', 'master_class', 'title'], filters: byIds('name', ids) }) },
  trainingBookings(userId: string) { return getResourceList<TrainingBookingRecord>('Training Booking', { fields: ['name', 'slot', 'participant', 'booked_by', 'status'], filters: [['booked_by', '=', userId]], limit: 50 }) },
  trainingSlots(ids: string[]) { return getResourceList<TrainingSlotRecord>('Training Slot', { fields: ['name', 'training_offering', 'trainer', 'start_datetime', 'end_datetime', 'venue', 'status'], filters: byIds('name', ids) }) },
  trainingOfferings(ids: string[]) { return getResourceList<TrainingOfferingRecord>('Training Offering', { fields: ['name', 'trainer', 'title', 'direction', 'default_venue'], filters: byIds('name', ids) }) },
}
