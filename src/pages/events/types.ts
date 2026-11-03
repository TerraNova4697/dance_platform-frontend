export type EventsView = 'list' | 'map'
export type EventSort = 'date' | 'price_asc' | 'price_desc' | 'title'
export type DatePreset = 'all' | 'today' | 'tomorrow' | 'week' | 'weekend' | 'custom'
export type CatalogEventType = 'all' | 'tournament' | 'master_class'
export type ArchiveFilter = 'upcoming' | 'archived' | 'all'

export interface EventsFiltersState {
  date: DatePreset
  dateFrom: string
  dateTo: string
  city: string
  country: string
  direction: string
  type: CatalogEventType
  priceFrom: string
  priceTo: string
  archive: ArchiveFilter
}

export const initialFilters: EventsFiltersState = {
  date: 'all',
  dateFrom: '',
  dateTo: '',
  city: '',
  country: '',
  direction: '',
  type: 'all',
  priceFrom: '',
  priceTo: '',
  archive: 'upcoming',
}
