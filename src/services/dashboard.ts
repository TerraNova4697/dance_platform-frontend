import { dashboardApi, type DanceEventRecord, type EventPriceRecord, type HostRecord, type VenueRecord } from '../api/dashboard'
import type { AthleteDashboardProfile, DashboardActivity, EventPreview, ImportantNotificationData, RegisteredEventPreview, TrainingBookingPreview } from '../types/dashboard'

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
function registrationStatus(value?: string): RegisteredEventPreview['registrationStatus'] {
  const status = value?.toLowerCase().replaceAll(' ', '_')
  return status === 'pending_payment' || status === 'cancelled' || status === 'transferred' ? status : 'confirmed'
}
function bookingStatus(value?: string): TrainingBookingPreview['status'] {
  const status = value?.toLowerCase().replaceAll(' ', '_')
  return status === 'rescheduled' || status === 'cancelled' || status === 'completed' ? status : 'booked'
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

export async function getMyTrainings(userId: string): Promise<TrainingBookingPreview[]> {
  const bookings = await dashboardApi.trainingBookings(userId)
  if (!bookings.length) return []
  const slots = await dashboardApi.trainingSlots(bookings.map(({ slot }) => slot))
  const offerings = await dashboardApi.trainingOfferings(slots.map(({ training_offering }) => training_offering))
  const venueIds = slots.flatMap(({ venue }) => venue ? [venue] : [])
  const venues = venueIds.length ? await dashboardApi.venues(venueIds) : []
  const slotsById = index(slots), offeringsById = index(offerings), venuesById = index(venues)
  return bookings.flatMap((booking) => {
    const slot = slotsById.get(booking.slot)
    if (!slot) return []
    const offering = offeringsById.get(slot.training_offering), status = bookingStatus(booking.status)
    if (Date.parse(iso(slot.start_datetime)) < Date.now() || status === 'cancelled' || status === 'completed') return []
    return [{ id: booking.name, title: offering?.title ?? slot.training_offering, trainerId: slot.trainer, trainerName: slot.trainer, startAt: iso(slot.start_datetime), endAt: iso(slot.end_datetime), venueName: slot.venue ? venuesById.get(slot.venue)?.title ?? slot.venue : offering?.default_venue, status }]
  }).sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)).slice(0, 3)
}

export async function getMyEvents(userId: string): Promise<RegisteredEventPreview[]> {
  const [tournamentRegs, masterRegs] = await Promise.all([dashboardApi.tournamentRegistrations(userId), dashboardApi.masterRegistrations(userId)])
  const [tournaments, masterClasses] = await Promise.all([
    tournamentRegs.length ? dashboardApi.tournamentsByIds(tournamentRegs.map(({ tournament }) => tournament)) : [],
    masterRegs.length ? dashboardApi.masterClassesByIds(masterRegs.map(({ master_class }) => master_class)) : [],
  ])
  const eventIds = [...tournaments.map(({ event }) => event), ...masterClasses.map(({ event }) => event)]
  if (!eventIds.length) return []
  const events = await dashboardApi.eventsByIds(eventIds)
  const [context, tickets, entries, slots, packages] = await Promise.all([
    eventContext(events), dashboardApi.tickets(userId, eventIds),
    tournamentRegs.length ? dashboardApi.tournamentEntries(tournamentRegs.map(({ name }) => name)) : [],
    masterRegs.some(({ slot }) => slot) ? dashboardApi.masterSlots(masterRegs.flatMap(({ slot }) => slot ? [slot] : [])) : [],
    masterRegs.some(({ package: packageId }) => packageId) ? dashboardApi.masterPackages(masterRegs.flatMap(({ package: packageId }) => packageId ? [packageId] : [])) : [],
  ])
  const categories = entries.length ? await dashboardApi.tournamentCategories(entries.map(({ tournament_category }) => tournament_category)) : []
  const eventsById = index(events), tournamentsById = index(tournaments), mastersById = index(masterClasses)
  const categoriesById = index(categories), slotsById = index(slots), packagesById = index(packages)
  const ticketsByEvent = new Map(tickets.map((ticket) => [ticket.event, ticket]))
  const tournamentEvents = tournamentRegs.flatMap((registration): RegisteredEventPreview[] => {
    const tournament = tournamentsById.get(registration.tournament), event = tournament ? eventsById.get(tournament.event) : undefined
    if (!event) return []
    const registrationEntries = entries.filter(({ registration: id }) => id === registration.name).map((entry) => {
      const category = categoriesById.get(entry.tournament_category)
      return { id: entry.name, label: category ? [category.participation_type, category.category, category.level].filter(Boolean).join(' / ') : entry.tournament_category }
    })
    return [{ ...eventPreview(event, context), registrationStatus: registrationStatus(registration.status), entries: registrationEntries.length ? registrationEntries : [{ id: registration.name, label: registration.participation_type }], ticketId: ticketsByEvent.get(event.name)?.name }]
  })
  const masterEvents = masterRegs.flatMap((registration): RegisteredEventPreview[] => {
    const master = mastersById.get(registration.master_class), event = master ? eventsById.get(master.event) : undefined
    if (!event) return []
    const slot = registration.slot ? slotsById.get(registration.slot) : undefined
    const packageRecord = registration.package ? packagesById.get(registration.package) : undefined
    return [{ ...eventPreview(event, context), type: 'master_class', startAt: slot ? iso(slot.start_datetime) : iso(event.start_datetime), venueName: slot?.venue ?? eventPreview(event, context).venueName, registrationStatus: registrationStatus(registration.status), entries: [{ id: registration.name, label: packageRecord?.title ?? 'Мастер-класс' }], ticketId: ticketsByEvent.get(event.name)?.name }]
  })
  return [...tournamentEvents, ...masterEvents].filter((item) => Date.parse(item.startAt) >= Date.now() && item.registrationStatus !== 'cancelled').sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt)).slice(0, 3)
}

export async function getUpcomingEvents(): Promise<EventPreview[]> {
  const events = await dashboardApi.events([['start_datetime', '>=', frappeDate(new Date())], ['is_published', '=', 1], ['event_status', '!=', 'Cancelled']], 6)
  const context = await eventContext(events)
  return events.map((event) => eventPreview(event, context))
}

async function personalSchedule(userId: string): Promise<DashboardActivity[]> {
  const [events, trainings] = await Promise.all([getMyEvents(userId), getMyTrainings(userId)])
  return [...events.map((event): DashboardActivity => ({ id: event.id, type: event.type, title: event.title, startAt: event.startAt, venueName: event.venueName, secondaryInfo: event.entries.map(({ label }) => label).join(', '), status: event.registrationStatus, ticketId: event.ticketId })), ...trainings.map((training): DashboardActivity => ({ id: training.id, type: 'training', title: training.title, startAt: training.startAt, endAt: training.endAt, venueName: training.venueName, secondaryInfo: training.trainerName, status: training.status }))].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
}
export async function getNextActivity(userId: string): Promise<DashboardActivity | null> { return (await personalSchedule(userId))[0] ?? null }
export async function getUpcomingSchedule(userId: string): Promise<DashboardActivity[]> { return (await personalSchedule(userId)).slice(0, 5) }
export async function getImportantNotifications(): Promise<ImportantNotificationData[]> { return [] }
