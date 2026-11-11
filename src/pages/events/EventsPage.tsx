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
import {
  initialFilters,
  type CatalogEventType,
  type EventSort,
  type EventsFiltersState,
  type EventsView,
} from './types'
import '../dashboard/dashboard.css'
import './events.css'

const dateLabels = {
  all: '',
  today: 'Сегодня',
  tomorrow: 'Завтра',
  week: 'Эта неделя',
  weekend: 'Эти выходные',
  custom: 'Диапазон дат',
} as const

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

function filterEvents(
  events: EventPreview[],
  search: string,
  filters: EventsFiltersState,
  now: Date,
): EventPreview[] {
  const term = search.trim().toLocaleLowerCase('ru-RU')
  const from = filters.priceFrom ? Number(filters.priceFrom) : undefined
  const to = filters.priceTo ? Number(filters.priceTo) : undefined

  return events.filter((event) => {
    const searchable = [event.title, event.hostName, event.city, event.country, event.direction]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('ru-RU')

    const matchesSearch = !term || searchable.includes(term)
    const matchesCity =
      !filters.city || event.city.toLocaleLowerCase('ru-RU').includes(filters.city.toLocaleLowerCase('ru-RU'))
    const matchesCountry =
      !filters.country ||
      (event.country && event.country.toLocaleLowerCase('ru-RU').includes(filters.country.toLocaleLowerCase('ru-RU')))
    const matchesDirection = !filters.direction || event.direction === filters.direction
    const matchesType = filters.type === 'all' || event.type === filters.type
    const matchesPriceFrom = from === undefined || (event.minimumPrice !== undefined && event.minimumPrice >= from)
    const matchesPriceTo = to === undefined || (event.minimumPrice !== undefined && event.minimumPrice <= to)

    let matchesArchive = true
    if (filters.archive === 'upcoming') {
      matchesArchive = !event.isArchived
    } else if (filters.archive === 'archived') {
      matchesArchive = Boolean(event.isArchived)
    }

    return (
      matchesSearch &&
      matchesCity &&
      matchesCountry &&
      matchesDirection &&
      matchesType &&
      matchesPriceFrom &&
      matchesPriceTo &&
      matchesArchive &&
      matchesDate(event, filters, now)
    )
  })
}

function sortEvents(events: EventPreview[], sort: EventSort): EventPreview[] {
  return [...events].sort((left, right) => {
    if (sort === 'title') return left.title.localeCompare(right.title, 'ru')
    if (sort === 'price_asc')
      return (left.minimumPrice ?? Number.POSITIVE_INFINITY) - (right.minimumPrice ?? Number.POSITIVE_INFINITY)
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
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          next.set('view', 'list')
          return next
        },
        { replace: true },
      )
    }
  }, [searchParams, setSearchParams])

  const initialTypeFromUrl = searchParams.get('type')
  const [filters, setFilters] = useState<EventsFiltersState>(() => ({
    ...initialFilters,
    type:
      initialTypeFromUrl === 'tournament' || initialTypeFromUrl === 'master_class'
        ? (initialTypeFromUrl as CatalogEventType)
        : 'all',
  }))

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const debouncedCity = useDebouncedValue(filters.city, 400)
  const debouncedCountry = useDebouncedValue(filters.country, 400)
  const [sort, setSort] = useState<EventSort>('date')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState<string>()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [referenceDate] = useState(() => new Date())
  const userId = user ?? ''

  const profileQuery = useQuery({
    queryKey: ['dashboard', 'profile', userId],
    queryFn: () => getDashboardProfile(userId),
    enabled: Boolean(user),
  })

  const eventsQuery = useQuery({
    queryKey: ['events-catalog', debouncedCity, debouncedCountry, filters.archive],
    queryFn: () =>
      getEventsCatalog({
        city: debouncedCity || undefined,
        country: debouncedCountry || undefined,
        period: filters.archive === 'archived' ? 'archived' : 'all',
        isArchived: filters.archive === 'archived' ? 1 : 0,
        limit: 50,
      }),
  })

  const filteredEvents = useMemo(
    () => sortEvents(filterEvents(eventsQuery.data ?? [], debouncedSearch, filters, referenceDate), sort),
    [debouncedSearch, eventsQuery.data, filters, referenceDate, sort],
  )

  const directions = useMemo(
    () =>
      [...new Set((eventsQuery.data ?? []).flatMap((event) => (event.direction ? [event.direction] : [])))].sort(),
    [eventsQuery.data],
  )

  const firstName = profileQuery.data?.firstName ?? userId.split('@')[0] ?? 'Танцор'

  const activeChips = [
    filters.country && { key: 'country', label: `Страна: ${filters.country}` },
    filters.city && { key: 'city', label: `Город: ${filters.city}` },
    filters.direction && { key: 'direction', label: filters.direction },
    filters.archive !== 'upcoming' && {
      key: 'archive',
      label: filters.archive === 'archived' ? 'Только архив' : 'Все (с архивом)',
    },
    filters.date !== 'all' && {
      key: 'date',
      label:
        filters.date === 'custom' && (filters.dateFrom || filters.dateTo)
          ? `${filters.dateFrom || '…'} — ${filters.dateTo || '…'}`
          : dateLabels[filters.date],
    },
    (filters.priceFrom || filters.priceTo) && {
      key: 'price',
      label: `${filters.priceFrom ? `от ${filters.priceFrom}` : ''}${filters.priceFrom && filters.priceTo ? ' ' : ''}${filters.priceTo ? `до ${filters.priceTo}` : ''}`,
    },
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip))

  function handleTypeTabChange(nextType: CatalogEventType) {
    setFilters((current) => ({ ...current, type: nextType }))
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (nextType === 'all') {
          next.delete('type')
        } else {
          next.set('type', nextType)
        }
        return next
      },
      { replace: true },
    )
  }

  function removeFilter(key: string) {
    setFilters((current) => {
      if (key === 'date') return { ...current, date: 'all', dateFrom: '', dateTo: '' }
      if (key === 'price') return { ...current, priceFrom: '', priceTo: '' }
      if (key === 'archive') return { ...current, archive: 'upcoming' }
      return { ...current, [key]: '' }
    })
  }

  function changeView(nextView: EventsView) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('view', nextView)
        return next
      },
      { replace: true },
    )
    setSelectedEventId(undefined)
  }

  function selectEvent(id: string) {
    setSelectedEventId(id || undefined)
    if (id) {
      window.requestAnimationFrame(() =>
        document.getElementById(`map-event-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
      )
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="dashboard-page events-page">
      <DashboardHeader
        firstName={firstName}
        avatarUrl={profileQuery.data?.avatarUrl}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
      />
      <main className="events-main">
        <header className="events-title">
          <h1>Мероприятия</h1>
          <p>Соревнования, мастер-классы и тренировочные сборы</p>
        </header>

        {/* Primary Type Navigation Tabs */}
        <div className="catalog-type-tabs" role="tablist" aria-label="Тип мероприятий">
          <button
            type="button"
            role="tab"
            aria-selected={filters.type === 'all'}
            className={`catalog-tab ${filters.type === 'all' ? 'active' : ''}`}
            onClick={() => handleTypeTabChange('all')}
          >
            Все мероприятия
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.type === 'tournament'}
            className={`catalog-tab ${filters.type === 'tournament' ? 'active' : ''}`}
            onClick={() => handleTypeTabChange('tournament')}
          >
            Соревнования
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filters.type === 'master_class'}
            className={`catalog-tab ${filters.type === 'master_class' ? 'active' : ''}`}
            onClick={() => handleTypeTabChange('master_class')}
          >
            Мастер-классы и сборы
          </button>
        </div>

        <div className="events-search">
          <Icon name="events" size={19} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию, стране, городу или организатору"
            aria-label="Поиск мероприятий"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Очистить поиск">
              ×
            </button>
          )}
        </div>

        <EventsFilters
          filters={filters}
          setFilters={setFilters}
          directions={directions}
          resultCount={filteredEvents.length}
        />

        <button className="mobile-filter-button" type="button" onClick={() => setFiltersOpen(true)}>
          Фильтры {activeChips.length > 0 && <span>{activeChips.length}</span>}
        </button>

        {activeChips.length > 0 && (
          <div className="active-filter-chips" aria-label="Активные фильтры">
            {activeChips.map((chip) => (
              <button type="button" key={chip.key} onClick={() => removeFilter(chip.key)}>
                {chip.label} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}

        <div className="events-toolbar">
          <strong>
            {filteredEvents.length}{' '}
            {filteredEvents.length % 10 === 1 && filteredEvents.length % 100 !== 11
              ? 'мероприятие'
              : [2, 3, 4].includes(filteredEvents.length % 10) && ![12, 13, 14].includes(filteredEvents.length % 100)
                ? 'мероприятия'
                : 'мероприятий'}
          </strong>

          <div className="view-switch" aria-label="Режим отображения">
            <button
              className={view === 'list' ? 'active' : ''}
              type="button"
              onClick={() => changeView('list')}
            >
              ☷ <span>Список</span>
            </button>
            <button
              className={view === 'map' ? 'active' : ''}
              type="button"
              onClick={() => changeView('map')}
            >
              <Icon name="map" size={16} />
              <span>Карта</span>
            </button>
          </div>

          <label className="sort-control">
            <span>Сортировка:</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as EventSort)}>
              <option value="date">По дате</option>
              <option value="price_asc">Сначала дешевле</option>
              <option value="price_desc">Сначала дороже</option>
              <option value="title">По названию</option>
            </select>
          </label>
        </div>

        {eventsQuery.isPending ? (
          <Skeleton count={3} />
        ) : eventsQuery.isError ? (
          <WidgetError message="Не удалось загрузить мероприятия." onRetry={() => void eventsQuery.refetch()} />
        ) : !filteredEvents.length ? (
          <div className="catalog-empty">
            <strong>Мероприятия не найдены</strong>
            <p>Попробуйте изменить поиск или сбросить фильтры.</p>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setSearch('')
                setFilters(initialFilters)
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        ) : view === 'list' ? (
          <div className="catalog-grid">
            {filteredEvents.map((event) => (
              <CatalogEventCard event={event} key={event.id} />
            ))}
          </div>
        ) : (
          <div className="map-layout">
            <div className="map-side-list">
              {filteredEvents.map((event) => (
                <div
                  id={`map-event-${event.id}`}
                  key={event.id}
                  onMouseEnter={() => setSelectedEventId(event.id)}
                >
                  <CatalogEventCard
                    event={event}
                    compact
                    selected={selectedEventId === event.id}
                    onSelect={() => selectEvent(event.id)}
                  />
                </div>
              ))}
            </div>
            <EventMap events={filteredEvents} selectedEventId={selectedEventId} onSelect={selectEvent} />
          </div>
        )}
      </main>

      {filtersOpen && (
        <div className="filter-sheet-backdrop" role="presentation" onMouseDown={() => setFiltersOpen(false)}>
          <aside
            className="filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Фильтры мероприятий"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <EventsFilters
              mobile
              filters={filters}
              setFilters={setFilters}
              directions={directions}
              resultCount={filteredEvents.length}
              onClose={() => setFiltersOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  )
}
