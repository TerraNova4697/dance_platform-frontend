import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EventMap } from '../../features/map/EventMap'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useAuth } from '../../hooks/useAuth'
import { getDashboardProfile } from '../../services/dashboard'
import { getEventsCatalog } from '../../services/eventsCatalog'
import type { EventPreview } from '../../types/dashboard'
import { DashboardHeader } from '../dashboard/components/DashboardHeader'
import { Icon } from '../dashboard/components/Icons'
import { Skeleton, WidgetError } from '../dashboard/components/Shared'
import { CatalogEventCard } from './components/CatalogEventCard'
import { EventsFilters } from './components/EventsFilters'
import { initialFilters, type EventSort, type EventsFiltersState, type EventsView } from './types'
import '../dashboard/dashboard.css'
import './events.css'

const dateLabels = { all: '', today: 'Сегодня', tomorrow: 'Завтра', week: 'Эта неделя', weekend: 'Эти выходные', custom: 'Диапазон дат' } as const
const typeLabels = { all: '', tournament: 'Турниры', master_class: 'Мастер-классы' } as const

function dayStart(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function matchesDate(event: EventPreview, filters: EventsFiltersState, now: Date): boolean {
  if (filters.date === 'all') return true
  const eventDate = new Date(event.startAt)
  const difference = Math.round((dayStart(eventDate) - dayStart(now)) / 86_400_000)
  if (filters.date === 'today') return difference === 0
  if (filters.date === 'tomorrow') return difference === 1
  if (filters.date === 'week') return difference >= 0 && difference < 7
  if (filters.date === 'weekend') return difference >= 0 && difference < 7 && [0, 6].includes(eventDate.getDay())
  const value = eventDate.toISOString().slice(0, 10)
  return (!filters.dateFrom || value >= filters.dateFrom) && (!filters.dateTo || value <= filters.dateTo)
}

function filterEvents(events: EventPreview[], search: string, filters: EventsFiltersState, now: Date): EventPreview[] {
  const term = search.trim().toLocaleLowerCase('ru-RU')
  const from = filters.priceFrom ? Number(filters.priceFrom) : undefined
  const to = filters.priceTo ? Number(filters.priceTo) : undefined
  return events.filter((event) => {
    const searchable = [event.title, event.hostName, event.city, event.direction].filter(Boolean).join(' ').toLocaleLowerCase('ru-RU')
    return (!term || searchable.includes(term))
      && (!filters.city || event.city.toLocaleLowerCase('ru-RU').includes(filters.city.toLocaleLowerCase('ru-RU')))
      && (!filters.direction || event.direction === filters.direction)
      && (filters.type === 'all' || event.type === filters.type)
      && (!filters.age || event.ageGroups?.includes(filters.age) === true)
      && (!filters.level || event.levels?.includes(filters.level) === true)
      && (from === undefined || (event.minimumPrice !== undefined && event.minimumPrice >= from))
      && (to === undefined || (event.minimumPrice !== undefined && event.minimumPrice <= to))
      && matchesDate(event, filters, now)
  })
}

function sortEvents(events: EventPreview[], sort: EventSort): EventPreview[] {
  return [...events].sort((left, right) => {
    if (sort === 'title') return left.title.localeCompare(right.title, 'ru')
    if (sort === 'price_asc') return (left.minimumPrice ?? Number.POSITIVE_INFINITY) - (right.minimumPrice ?? Number.POSITIVE_INFINITY)
    if (sort === 'price_desc') return (right.minimumPrice ?? -1) - (left.minimumPrice ?? -1)
    return Date.parse(left.startAt) - Date.parse(right.startAt)
  })
}

export function EventsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const view: EventsView = searchParams.get('view') === 'map' ? 'map' : 'list'

  useEffect(() => {
    const currentView = searchParams.get('view')
    if (currentView !== 'list' && currentView !== 'map') {
      setSearchParams((current) => { const next = new URLSearchParams(current); next.set('view', 'list'); return next }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [filters, setFilters] = useState(initialFilters)
  const debouncedCity = useDebouncedValue(filters.city, 400)
  const [sort, setSort] = useState<EventSort>('date')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string>()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [referenceDate] = useState(() => new Date())
  const userId = user ?? ''
  const profileQuery = useQuery({ queryKey: ['dashboard', 'profile', userId], queryFn: () => getDashboardProfile(userId) })
  const eventsQuery = useQuery({ queryKey: ['events-catalog', userId, debouncedCity], queryFn: () => getEventsCatalog(userId, debouncedCity) })
  const events = useMemo(() => sortEvents(filterEvents(eventsQuery.data ?? [], debouncedSearch, filters, referenceDate), sort), [debouncedSearch, eventsQuery.data, filters, referenceDate, sort])
  const directions = useMemo(() => [...new Set((eventsQuery.data ?? []).flatMap((event) => event.direction ? [event.direction] : []))].sort(), [eventsQuery.data])
  const firstName = profileQuery.data?.firstName ?? userId.split('@')[0] ?? 'Танцор'
  const activeChips = [
    filters.city && { key: 'city', label: filters.city }, filters.direction && { key: 'direction', label: filters.direction },
    filters.type !== 'all' && { key: 'type', label: typeLabels[filters.type] }, filters.date !== 'all' && { key: 'date', label: filters.date === 'custom' && (filters.dateFrom || filters.dateTo) ? `${filters.dateFrom || '…'} — ${filters.dateTo || '…'}` : dateLabels[filters.date] },
    filters.age && { key: 'age', label: filters.age }, filters.level && { key: 'level', label: filters.level },
    (filters.priceFrom || filters.priceTo) && { key: 'price', label: `${filters.priceFrom ? `от ${filters.priceFrom}` : ''}${filters.priceFrom && filters.priceTo ? ' ' : ''}${filters.priceTo ? `до ${filters.priceTo}` : ''} ₸` },
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip))

  function removeFilter(key: string) {
    setFilters((current) => {
      if (key === 'date') return { ...current, date: 'all', dateFrom: '', dateTo: '' }
      if (key === 'price') return { ...current, priceFrom: '', priceTo: '' }
      return { ...current, [key]: key === 'type' ? 'all' : '' }
    })
  }
  function changeView(nextView: EventsView) {
    setSearchParams((current) => { const next = new URLSearchParams(current); next.set('view', nextView); return next }, { replace: true })
    setSelectedEventId(undefined)
  }
  function selectEvent(id: string) {
    setSelectedEventId(id || undefined)
    if (id) window.requestAnimationFrame(() => document.getElementById(`map-event-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }
  async function handleLogout() {
    setIsLoggingOut(true)
    try { await logout(); navigate('/login', { replace: true }) } catch { setIsLoggingOut(false) }
  }

  return (
    <div className="dashboard-page events-page">
      <DashboardHeader firstName={firstName} avatarUrl={profileQuery.data?.avatarUrl} onLogout={() => void handleLogout()} isLoggingOut={isLoggingOut} />
      <main className="events-main">
        <header className="events-title"><h1>Ивенты</h1><p>Турниры и мастер-классы рядом с вами</p></header>
        <div className="events-search"><Icon name="events" size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по названию, организатору, городу или направлению" aria-label="Поиск Ивентов" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Очистить поиск">×</button>}</div>
        <EventsFilters filters={filters} setFilters={setFilters} directions={directions} resultCount={events.length} />
        <button className="mobile-filter-button" type="button" onClick={() => setFiltersOpen(true)}>Фильтры {activeChips.length > 0 && <span>{activeChips.length}</span>}</button>
        {activeChips.length > 0 && <div className="active-filter-chips" aria-label="Активные фильтры">{activeChips.map((chip) => <button type="button" key={chip.key} onClick={() => removeFilter(chip.key)}>{chip.label} <span aria-hidden="true">×</span></button>)}</div>}
        <div className="events-toolbar"><strong>{events.length} {events.length === 1 ? 'Ивент' : 'Ивентов'}</strong><div className="view-switch" aria-label="Режим отображения"><button className={view === 'list' ? 'active' : ''} type="button" onClick={() => changeView('list')}>☷ <span>Список</span></button><button className={view === 'map' ? 'active' : ''} type="button" onClick={() => changeView('map')}><Icon name="map" size={16} /><span>Карта</span></button></div><label className="sort-control"><span>Сортировка:</span><select value={sort} onChange={(event) => setSort(event.target.value as EventSort)}><option value="date">По дате</option><option value="price_asc">Сначала дешевле</option><option value="price_desc">Сначала дороже</option><option value="title">По названию</option></select></label></div>
        {eventsQuery.isPending ? <Skeleton count={3} /> : eventsQuery.isError ? <WidgetError message="Не удалось загрузить Ивенты." onRetry={() => void eventsQuery.refetch()} /> : !events.length ? <div className="catalog-empty"><strong>Ивенты не найдены</strong><p>Попробуйте изменить поиск или сбросить фильтры.</p><button className="button secondary" type="button" onClick={() => { setSearch(''); setFilters(initialFilters) }}>Сбросить фильтры</button></div> : view === 'list' ? <div className="catalog-grid">{events.map((event) => <CatalogEventCard event={event} key={event.id} />)}</div> : <div className="map-layout"><div className="map-side-list">{events.map((event) => <div id={`map-event-${event.id}`} key={event.id} onMouseEnter={() => setSelectedEventId(event.id)}><CatalogEventCard event={event} compact selected={selectedEventId === event.id} onSelect={() => selectEvent(event.id)} /></div>)}</div><EventMap events={events} selectedEventId={selectedEventId} onSelect={selectEvent} /></div>}
      </main>
      {filtersOpen && <div className="filter-sheet-backdrop" role="presentation" onMouseDown={() => setFiltersOpen(false)}><aside className="filter-sheet" role="dialog" aria-modal="true" aria-label="Фильтры Ивентов" onMouseDown={(event) => event.stopPropagation()}><EventsFilters mobile filters={filters} setFilters={setFilters} directions={directions} resultCount={events.length} onClose={() => setFiltersOpen(false)} /></aside></div>}
    </div>
  )
}
