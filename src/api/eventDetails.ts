import { frappeFetch } from './frappe'

const methodRoot = '/api/method/dance_platform.api'

function queryPath(method: string, key: 'event_id' | 'venue_id', value: string): string {
  const query = new URLSearchParams({ [key]: value })
  return `${methodRoot}.${method}.${method}?${query}`
}

export function fetchEventDetails(eventId: string): Promise<unknown> {
  return frappeFetch(queryPath('get_event_details', 'event_id', eventId))
}

export function fetchTournamentCategories(eventId: string): Promise<unknown> {
  return frappeFetch(queryPath('get_tournament_categories', 'event_id', eventId))
}

export function fetchMasterClassSlots(eventId: string): Promise<unknown> {
  return frappeFetch(queryPath('get_master_class_slots', 'event_id', eventId))
}

export function fetchSpectatorTicketTypes(eventId: string): Promise<unknown> {
  return frappeFetch(queryPath('get_spectator_ticket_types', 'event_id', eventId))
}

export function fetchVenue(venueId: string): Promise<unknown> {
  return frappeFetch(queryPath('get_venue', 'venue_id', venueId))
}
