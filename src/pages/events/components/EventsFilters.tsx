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

export function EventsFilters({
  filters,
  setFilters,
  directions,
  resultCount,
  mobile,
  onClose,
}: FiltersProps) {
  const update = <K extends keyof EventsFiltersState>(key: K, value: EventsFiltersState[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const reset = () =>
    setFilters((current) => ({
      ...current,
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
    }))

  return (
    <div className={mobile ? 'mobile-filter-content' : 'desktop-filters'}>
      {mobile && (
        <div className="filter-sheet-title">
          <h2>Фильтры</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть фильтры">
            ×
          </button>
        </div>
      )}

      <label>
        <span>Период</span>
        <select
          value={filters.archive}
          onChange={(event) => update('archive', event.target.value as EventsFiltersState['archive'])}
        >
          <option value="upcoming">Предстоящие</option>
          <option value="archived">Архив мероприятий</option>
          <option value="all">Все (включая архив)</option>
        </select>
      </label>

      <label>
        <span>Дата</span>
        <select
          value={filters.date}
          onChange={(event) => update('date', event.target.value as EventsFiltersState['date'])}
        >
          <option value="all">Любая дата</option>
          <option value="today">Сегодня</option>
          <option value="tomorrow">Завтра</option>
          <option value="week">Эта неделя</option>
          <option value="weekend">Эти выходные</option>
          <option value="custom">Выбрать диапазон</option>
        </select>
      </label>

      {filters.date === 'custom' && (
        <div className="date-range">
          <label>
            <span>От</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => update('dateFrom', event.target.value)}
            />
          </label>
          <label>
            <span>До</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => update('dateTo', event.target.value)}
            />
          </label>
        </div>
      )}

      <label>
        <span>Страна</span>
        <input
          type="search"
          placeholder="Все страны (Казахстан, Великобритания...)"
          value={filters.country}
          onChange={(event) => update('country', event.target.value)}
        />
      </label>

      <label>
        <span>Город</span>
        <input
          type="search"
          placeholder="Введите город"
          value={filters.city}
          onChange={(event) => update('city', event.target.value)}
        />
      </label>

      <label>
        <span>Направление</span>
        <select
          value={filters.direction}
          onChange={(event) => update('direction', event.target.value)}
        >
          <option value="">Все направления</option>
          {directions.map((direction) => (
            <option key={direction}>{direction}</option>
          ))}
        </select>
      </label>

      <div className="price-fields">
        <label>
          <span>Цена от</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={filters.priceFrom}
            onChange={(event) => update('priceFrom', event.target.value)}
          />
        </label>
        <label>
          <span>Цена до</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={filters.priceTo}
            onChange={(event) => update('priceTo', event.target.value)}
          />
        </label>
      </div>

      <button className="filters-reset" type="button" onClick={reset}>
        Сбросить
      </button>

      {mobile && (
        <button className="button primary apply-filters" type="button" onClick={onClose}>
          Показать {resultCount}{' '}
          {resultCount % 10 === 1 && resultCount % 100 !== 11
            ? 'мероприятие'
            : [2, 3, 4].includes(resultCount % 10) && ![12, 13, 14].includes(resultCount % 100)
              ? 'мероприятия'
              : 'мероприятий'}
        </button>
      )}
    </div>
  )
}
