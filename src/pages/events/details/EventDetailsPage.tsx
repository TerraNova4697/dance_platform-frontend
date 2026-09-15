import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FrappeApiError } from '../../../api/frappe'
import { useAuth } from '../../../hooks/useAuth'
import { routes } from '../../../routes'
import { getDashboardProfile } from '../../../services/dashboard'
import {
  getEventDetails,
  getMasterClassSlots,
  getSpectatorTicketTypes,
  getTournamentCategories,
  getVenue,
  InvalidEventDetailsError,
} from '../../../services/eventDetails'
import { DashboardHeader } from '../../dashboard/components/DashboardHeader'
import { Icon } from '../../dashboard/components/Icons'
import {
  EventAbout,
  EventContactsAndOrganizer,
  EventLocation,
  EventPeople,
  EventPoster,
  EventPricing,
  EventRules,
  EventSchedule,
} from './components/EventSections'
import { EventHero, EventMobileCta, EventRegistrationCard, EventStatusBanner } from './components/EventHero'
import { MasterClassSlots, SpectatorTickets, TournamentCategories } from './components/EventTypeSections'
import { MasterClassPackages } from './components/MasterClassPackages'
import '../../dashboard/dashboard.css'
import './event-details.css'

function EventDetailsSkeleton() {
  return <main className="event-details-main" aria-busy="true" aria-label="Загрузка Ивента"><div className="details-skeleton back" /><div className="details-skeleton hero" /><div className="event-body-grid"><div><div className="details-skeleton section" /><div className="details-skeleton section" /><div className="details-skeleton map" /></div><div className="details-skeleton sidebar" /></div></main>
}

function isNotFound(error: unknown): boolean {
  return (error instanceof FrappeApiError && error.status === 404) || (error instanceof InvalidEventDetailsError && error.message === 'Ивент не найден')
}

export function EventDetailsPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const profileQuery = useQuery({ queryKey: ['dashboard', 'profile', user], queryFn: () => getDashboardProfile(user ?? ''), enabled: Boolean(user) })
  const eventQuery = useQuery({ queryKey: ['event-details', eventId], queryFn: () => getEventDetails(eventId), enabled: Boolean(eventId), retry: (count, error) => !isNotFound(error) && count < 2 })
  const event = eventQuery.data
  const categoriesQuery = useQuery({ queryKey: ['tournament-categories', eventId], queryFn: () => getTournamentCategories(eventId), enabled: event?.type === 'tournament' })
  const slotsQuery = useQuery({ queryKey: ['master-class-slots', eventId], queryFn: () => getMasterClassSlots(eventId), enabled: event?.type === 'master_class' })
  const ticketsQuery = useQuery({ queryKey: ['spectator-tickets', eventId], queryFn: () => getSpectatorTicketTypes(eventId), enabled: Boolean(event) })
  const venueQuery = useQuery({ queryKey: ['venue', event?.venue.id], queryFn: () => getVenue(event?.venue.id ?? ''), enabled: Boolean(event?.venue.id) })
  const venue = venueQuery.data ? { ...event?.venue, ...venueQuery.data } : event?.venue
  const firstName = profileQuery.data?.firstName ?? user?.split('@')[0] ?? 'Гость'

  async function handleLogout() {
    if (!user) { navigate('/login'); return }
    setIsLoggingOut(true)
    try { await logout(); navigate('/login', { replace: true }) } catch { setIsLoggingOut(false) }
  }

  function goBack() {
    if (location.key !== 'default') navigate(-1)
    else navigate(routes.events)
  }

  const header = <DashboardHeader firstName={firstName} avatarUrl={profileQuery.data?.avatarUrl} onLogout={() => void handleLogout()} isLoggingOut={isLoggingOut} actionLabel={user ? undefined : 'Войти'} />
  if (eventQuery.isPending) return <div className="dashboard-page event-details-page">{header}<EventDetailsSkeleton /></div>
  if (eventQuery.isError || !event) {
    const notFound = isNotFound(eventQuery.error)
    return <div className="dashboard-page event-details-page">{header}<main className="event-details-main"><div className="event-page-state" role={notFound ? undefined : 'alert'}><Icon name="events" size={34} /><h1>{notFound ? 'Ивент не найден' : 'Не удалось загрузить Ивент'}</h1><p>{notFound ? 'Возможно, он был удален или ссылка больше недействительна.' : 'Проверьте подключение и попробуйте еще раз.'}</p>{notFound ? <Link className="button primary" to={routes.events}>Вернуться к Ивентам</Link> : <button className="button primary" type="button" onClick={() => void eventQuery.refetch()}>Повторить</button>}</div></main></div>
  }

  const registerPath = `/events/${encodeURIComponent(event.id)}/register`
  const registrationHref = user ? registerPath : `/login?redirect=${encodeURIComponent(registerPath)}`
  const ticketBaseHref = `/events/${encodeURIComponent(event.id)}/tickets`
  const firstAvailableTicket = ticketsQuery.data?.find((ticket) => ticket.availabilityStatus === 'available' || ticket.availabilityStatus === 'low')
  const ticketHref = firstAvailableTicket ? `${ticketBaseHref}?ticket_type=${encodeURIComponent(firstAvailableTicket.id)}` : undefined

  return (
    <div className="dashboard-page event-details-page">
      {header}
      <main className="event-details-main">
        <button className="event-back" type="button" onClick={goBack}>← Назад к Ивентам</button>
        <EventStatusBanner event={event} />
        <div className="event-top-grid"><EventHero event={event} /><EventRegistrationCard event={event} registrationHref={registrationHref} ticketHref={ticketHref} /></div>
        <nav className="event-anchor-nav" aria-label="Разделы Ивента"><a href="#about">Описание</a><a href="#schedule">Расписание</a><a href={event.type === 'tournament' ? '#categories' : '#slots'}>{event.type === 'tournament' ? 'Категории' : 'Слоты'}</a><a href="#pricing">Стоимость</a><a href="#location">Место</a><a href="#rules">Правила</a></nav>
        <div className="event-body-grid">
          <div className="event-content-column">
            <EventAbout event={event} />
            <EventPoster event={event} />
            <EventSchedule event={event} />
            {event.type === 'tournament' ? <TournamentCategories categories={categoriesQuery.data ?? []} isLoading={categoriesQuery.isPending} isError={categoriesQuery.isError} onRetry={() => void categoriesQuery.refetch()} /> : <MasterClassSlots eventId={event.id} slots={slotsQuery.data ?? []} isLoading={slotsQuery.isPending} isError={slotsQuery.isError} onRetry={() => void slotsQuery.refetch()} registrationHref={registrationHref} />}
            {event.type === 'master_class' && <MasterClassPackages packages={event.packages} registrationHref={registrationHref} />}
            <EventPeople event={event} />
            <EventPricing event={event} />
            <SpectatorTickets eventId={event.id} tickets={ticketsQuery.data ?? []} isLoading={ticketsQuery.isPending} isError={ticketsQuery.isError} onRetry={() => void ticketsQuery.refetch()} purchaseBaseHref={ticketBaseHref} />
            {venue && <EventLocation venue={venue} isLoading={venueQuery.isPending && Boolean(event.venue.id)} />}
            <EventRules event={event} />
            <EventContactsAndOrganizer event={event} />
          </div>
          <div className="event-sidebar"><EventRegistrationCard event={event} registrationHref={registrationHref} ticketHref={ticketHref} /></div>
        </div>
      </main>
      <EventMobileCta event={event} registrationHref={registrationHref} ticketHref={ticketHref} />
    </div>
  )
}
