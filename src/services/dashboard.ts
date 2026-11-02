import { dashboardApi, type DanceEventRecord, type EventPriceRecord, type HostRecord, type VenueRecord } from '../api/dashboard'
import { fetchSchedule } from '../api/schedule'
import { getMyEvents, getAllMyEvents } from './myEvents'
import { getMyTrainings } from './myTrainings'
import type { AthleteDashboardProfile, DashboardActivity, EventPreview, ImportantNotificationData } from '../types/dashboard'

export { getMyEvents, getAllMyEvents, getMyTrainings }

type EventContext = { venues: Map<string, VenueRecord>; hosts: Map<string, HostRecord>; prices: Map<string, EventPriceRecord>; directions: Map<string, string> }
const iso = (value: string) => value.includes('T') ? value : value.replace(' ', 'T')
const frappeDate = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ')
const index = <T extends { name: string }>(items: T[]) => new Map(items.map((item) => [item.name, item]))

function currency(value?: string): EventPreview['currency'] {
  return value === 'RUB' || value === 'USD' || value === 'EUR' ? value : 'KZT'
}
function eventType(value: string): EventPreview['type'] {
  return value.toLowerCase().includes('master') ? 'master_class' : 'tournament'
}

async function eventContext(events: DanceEventRecord[]): Promise<EventContext> {
  if (!events.length) return { venues: new Map(), hosts: new Map(), prices: new Map(), directions: new Map() }
  const ids = events.map(({ name }) => name)
  const [venues, hosts, prices, tournaments] = await Promise.all([
    dashboardApi.venues(events.flatMap(({ venue }) => venue ? [venue] : [])),
    dashboardApi.hosts(events.map(({ host }) => host)), dashboardApi.prices(ids), dashboardApi.tournamentsByEvents(ids),
  ])
  const categories = tournaments.length ? await dashboardApi.tournamentCategoriesByTournaments(tournaments.map(({ name }) => name)) : []
  const categoryByTournament = new Map<string, string>()
  categories.forEach((item) => { if (!categoryByTournament.has(item.tournament)) categoryByTournament.set(item.tournament, item.discipline) })
  const directions = new Map<string, string>()
  tournaments.forEach((item) => { const direction = categoryByTournament.get(item.name); if (direction) directions.set(item.event, direction) })
  const minimumPrices = new Map<string, EventPriceRecord>()
  prices.forEach((item) => { const current = minimumPrices.get(item.event); if (!current || item.price < current.price) minimumPrices.set(item.event, item) })
  return { venues: index(venues), hosts: index(hosts), prices: minimumPrices, directions }
}

function eventPreview(event: DanceEventRecord, context: EventContext): EventPreview {
  const venue = event.venue ? context.venues.get(event.venue) : undefined
  const host = context.hosts.get(event.host)
  const price = context.prices.get(event.name)
  return { id: event.name, type: eventType(event.event_type), title: event.title, coverUrl: event.cover, startAt: iso(event.start_datetime), city: venue?.city ?? host?.city ?? '', venueName: venue?.title, direction: context.directions.get(event.name), hostName: host?.display_name ?? event.host, minimumPrice: price?.price, currency: currency(price?.currency ?? event.currency) }
}

export async function getDashboardProfile(userId: string): Promise<AthleteDashboardProfile> {
  const profile = await dashboardApi.athleteProfile(userId)
  return { id: profile.id, firstName: profile.firstName, avatarUrl: profile.avatarUrl ?? undefined, city: profile.city ?? undefined }
}

export async function getUpcomingEvents(): Promise<EventPreview[]> {
  const events = await dashboardApi.events([['start_datetime', '>=', frappeDate(new Date())], ['is_published', '=', 1], ['event_status', '!=', 'Cancelled']], 6)
  const context = await eventContext(events)
  return events.map((event) => eventPreview(event, context))
}

export async function getNextActivity(userId: string): Promise<DashboardActivity | null> {
  const activity = await dashboardApi.nextActivity(userId)
  if (!activity) return null
  return {
    ...activity,
    startAt: iso(activity.startAt),
    endAt: activity.endAt ? iso(activity.endAt) : undefined,
  }
}
export async function getUpcomingSchedule(userId: string): Promise<DashboardActivity[]> { return (await fetchSchedule(userId, 5)).map((activity) => ({ ...activity, startAt: iso(activity.startAt), endAt: activity.endAt ? iso(activity.endAt) : undefined })) }
export async function getAllUpcomingSchedule(userId: string): Promise<DashboardActivity[]> { return (await fetchSchedule(userId, 50)).map((activity) => ({ ...activity, startAt: iso(activity.startAt), endAt: activity.endAt ? iso(activity.endAt) : undefined })) }
export async function getImportantNotifications(): Promise<ImportantNotificationData[]> { return [] }
