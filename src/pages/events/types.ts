export type EventsView = 'list' | 'map'
export type EventSort = 'date' | 'price_asc' | 'price_desc' | 'title'
export type DatePreset = 'all' | 'today' | 'tomorrow' | 'week' | 'weekend' | 'custom'
export type CatalogEventType = 'all' | 'tournament' | 'master_class'

export interface EventsFiltersState {
  date: DatePreset
  dateFrom: string
  dateTo: string
  city: string
  direction: string
  type: CatalogEventType
  age: string
  level: string
  priceFrom: string
  priceTo: string
}

export const initialFilters: EventsFiltersState = {
  date: 'all', dateFrom: '', dateTo: '', city: '', direction: '', type: 'all',
  age: '', level: '', priceFrom: '', priceTo: '',
}
