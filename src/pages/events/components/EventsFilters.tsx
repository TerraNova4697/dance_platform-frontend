import type { Dispatch, SetStateAction } from 'react'
import type { EventsFiltersState } from '../types'

type FiltersProps = {
  filters: EventsFiltersState
  setFilters: Dispatch<SetStateAction<EventsFiltersState>>
  directions: string[]
  resultCount: number
  mobile?: boolean
  onClose?: () => void
}

export function EventsFilters({ filters, setFilters, directions, resultCount, mobile, onClose }: FiltersProps) {
  const update = <K extends keyof EventsFiltersState>(key: K, value: EventsFiltersState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }
  const reset = () => setFilters((current) => ({ ...current, date: 'all', dateFrom: '', dateTo: '', city: '', direction: '', type: 'all', age: '', level: '', priceFrom: '', priceTo: '' }))

  return (
    <div className={mobile ? 'mobile-filter-content' : 'desktop-filters'}>
      {mobile && <div className="filter-sheet-title"><h2>Фильтры</h2><button type="button" onClick={onClose} aria-label="Закрыть фильтры">×</button></div>}
      <label><span>Дата</span><select value={filters.date} onChange={(event) => update('date', event.target.value as EventsFiltersState['date'])}><option value="all">Любая дата</option><option value="today">Сегодня</option><option value="tomorrow">Завтра</option><option value="week">Эта неделя</option><option value="weekend">Эти выходные</option><option value="custom">Выбрать дату</option></select></label>
      {filters.date === 'custom' && <div className="date-range"><label><span>От</span><input type="date" value={filters.dateFrom} onChange={(event) => update('dateFrom', event.target.value)} /></label><label><span>До</span><input type="date" value={filters.dateTo} onChange={(event) => update('dateTo', event.target.value)} /></label></div>}
      <label><span>Город</span><input type="search" placeholder="Введите город" value={filters.city} onChange={(event) => update('city', event.target.value)} /></label>
      <label><span>Направление</span><select value={filters.direction} onChange={(event) => update('direction', event.target.value)}><option value="">Все направления</option>{directions.map((direction) => <option key={direction}>{direction}</option>)}</select></label>
      <label><span>Тип</span><select value={filters.type} onChange={(event) => update('type', event.target.value as EventsFiltersState['type'])}><option value="all">Все</option><option value="tournament">Турниры</option><option value="master_class">Мастер-классы</option></select></label>
      <label><span>Возраст</span><select value={filters.age} onChange={(event) => update('age', event.target.value)}><option value="">Все возрасты</option><option>Дети</option><option>Подростки</option><option>Взрослые</option></select></label>
      <label><span>Уровень</span><select value={filters.level} onChange={(event) => update('level', event.target.value)}><option value="">Все уровни</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Pro</option></select></label>
      <div className="price-fields"><label><span>Цена от</span><input type="number" min="0" inputMode="numeric" value={filters.priceFrom} onChange={(event) => update('priceFrom', event.target.value)} /></label><label><span>Цена до</span><input type="number" min="0" inputMode="numeric" value={filters.priceTo} onChange={(event) => update('priceTo', event.target.value)} /></label></div>
      <button className="filters-reset" type="button" onClick={reset}>Сбросить</button>
      {mobile && <button className="button primary apply-filters" type="button" onClick={onClose}>Показать {resultCount} Ивентов</button>}
    </div>
  )
}
