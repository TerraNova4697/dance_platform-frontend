import { useEffect, useState, useRef, useMemo, type ReactNode } from 'react'
import {
  getRussianCountries,
  getRussianRegions,
  getCitiesForRegion,
  findRegionForCity,
  normalizeCityName,
  resolveCountryCode,
  type CountryOption,
  type RegionOption,
} from '../utils/geoRu'

export type CitySelectInputProps = {
  countryCode?: string
  onCountryChange?: (iso2: string) => void
  city: string
  onCityChange: (cityName: string) => void
  error?: string
  disabled?: boolean
  showCountry?: boolean
  cityLabel?: string
  required?: boolean
  children?: ReactNode
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      height="18"
      width="18"
      viewBox="0 0 20 20"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 180ms ease',
      }}
    >
      <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" />
    </svg>
  )
}

type DropdownItem = {
  id: string
  label: string
  flag?: string
  isCustom?: boolean
}

type SearchableSelectProps = {
  disabled?: boolean
  hasError?: boolean
  valueLabel: string
  placeholder: string
  flag?: string
  searchPlaceholder: string
  searchQuery: string
  onSearchChange: (query: string) => void
  isOpen: boolean
  onToggle: () => void
  items: DropdownItem[]
  selectedId?: string
  onSelect: (item: DropdownItem) => void
  emptyText?: string
  zIndex?: number
}

function SearchableSelect({
  disabled,
  hasError,
  valueLabel,
  placeholder,
  flag,
  searchPlaceholder,
  searchQuery,
  onSearchChange,
  isOpen,
  onToggle,
  items,
  selectedId,
  onSelect,
  emptyText = 'Ничего не найдено',
  zIndex = 100,
}: SearchableSelectProps) {
  const hasValue = Boolean(valueLabel)

  return (
    <div
      className={`geo-select-wrapper ${disabled ? 'is-disabled' : ''} ${
        hasError ? 'has-error' : ''
      }`}
    >
      <div className="stdropdown-container">
        <div
          className="stdropdown-input"
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) onToggle()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!disabled) onToggle()
            }
          }}
        >
          <div className="stdropdown-trigger">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              {flag && <span className="stdropdown-flag">{flag}</span>}
              <span className={`stdropdown-value ${!hasValue ? 'is-placeholder' : ''}`}>
                {hasValue ? valueLabel : placeholder}
              </span>
            </div>
            <div className="stdropdown-tools">
              <div className="stdropdown-tool">
                <ChevronIcon open={isOpen} />
              </div>
            </div>
          </div>
        </div>

        {isOpen && (
          <div
            className="stdropdown-menu"
            style={{ zIndex }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="stdropdown-search-header">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onToggle()
                  } else if (e.key === 'Enter' && items.length > 0) {
                    e.preventDefault()
                    onSelect(items[0])
                  }
                }}
              />
            </div>

            <div className="stdropdown-items-list">
              {items.length === 0 ? (
                <div className="stdropdown-empty">{emptyText}</div>
              ) : (
                items.map((item) => {
                  const isSelected = selectedId
                    ? selectedId.toLowerCase() === item.id.toLowerCase()
                    : false
                  return (
                    <div
                      key={item.id}
                      className={`stdropdown-item ${isSelected ? 'selected' : ''} ${
                        item.isCustom ? 'stdropdown-item-custom' : ''
                      }`}
                      onClick={() => onSelect(item)}
                    >
                      {item.flag && <span className="stdropdown-flag">{item.flag}</span>}
                      <span>{item.label}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CitySelectInput({
  countryCode = 'KZ',
  onCountryChange,
  city,
  onCityChange,
  error,
  disabled = false,
  showCountry = true,
  cityLabel = 'Город',
  required = false,
  children,
}: CitySelectInputProps) {
  const resolvedInitialCountry = useMemo(() => resolveCountryCode(countryCode), [countryCode])
  const [currentCountryCode, setCurrentCountryCode] = useState<string>(resolvedInitialCountry)
  const [prevCountryProp, setPrevCountryProp] = useState<string>(countryCode || 'KZ')
  const [selectedRegion, setSelectedRegion] = useState<RegionOption | undefined>()
  const [customRegion, setCustomRegion] = useState<string>('')

  // Adjust state during render when countryCode prop changes (React recommended pattern)
  if (countryCode && countryCode !== prevCountryProp) {
    setPrevCountryProp(countryCode)
    const code = resolveCountryCode(countryCode)
    setCurrentCountryCode(code)
    setSelectedRegion(undefined)
    setCustomRegion('')
  }

  // Dropdown open states
  const [isCountryOpen, setIsCountryOpen] = useState(false)
  const [isRegionOpen, setIsRegionOpen] = useState(false)
  const [isCityOpen, setIsCityOpen] = useState(false)

  // Search filter query strings
  const [countrySearch, setCountrySearch] = useState('')
  const [regionSearch, setRegionSearch] = useState('')
  const [citySearch, setCitySearch] = useState('')

  // Refs for click outside
  const countryRef = useRef<HTMLDivElement>(null)
  const regionRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)

  // All Russian countries
  const countries = useMemo(() => getRussianCountries(), [])

  // Regions for current country
  const regions = useMemo(
    () => getRussianRegions(currentCountryCode),
    [currentCountryCode]
  )

  // Derive active region if user hasn't explicitly selected one
  const activeRegion = useMemo(() => {
    if (selectedRegion) return selectedRegion
    if (customRegion) {
      return { id: customRegion, name: customRegion, cities: [] }
    }
    if (city) {
      return findRegionForCity(currentCountryCode, city)
    }
    return undefined
  }, [selectedRegion, customRegion, city, currentCountryCode])

  // Cities for current region
  const availableCities = useMemo(() => {
    if (activeRegion && activeRegion.cities.length > 0) {
      return getCitiesForRegion(currentCountryCode, activeRegion.id)
    }
    // If no region selected, collect all cities for this country with key cities at the top
    const all = regions.flatMap((r) => r.cities)
    const unique = Array.from(new Set(all))
    // Prioritize republican cities
    const priority = ['Астана', 'Алматы', 'Шымкент']
    const top = priority.filter((p) => unique.includes(p))
    const rest = unique.filter((p) => !priority.includes(p))
    return [...top, ...rest]
  }, [currentCountryCode, activeRegion, regions])

  // Current country object
  const currentCountry = useMemo(() => {
    return (
      countries.find((c) => c.code === currentCountryCode.toUpperCase()) || {
        code: currentCountryCode,
        name: 'Казахстан',
        emoji: '🇰🇿',
      }
    )
  }, [countries, currentCountryCode])

  // Normalize legacy "Nur-Sultan" / "Нур-Султан" in parent city prop
  useEffect(() => {
    if (!city) return
    const normalized = normalizeCityName(city)
    if (normalized !== city) {
      onCityChange(normalized)
    }
  }, [city, onCityChange])

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | PointerEvent) {
      const target = event.target as Node
      if (countryRef.current && !countryRef.current.contains(target)) {
        setIsCountryOpen(false)
      }
      if (regionRef.current && !regionRef.current.contains(target)) {
        setIsRegionOpen(false)
      }
      if (cityRef.current && !cityRef.current.contains(target)) {
        setIsCityOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [])

  // COUNTRY HANDLERS
  function handleSelectCountry(country: CountryOption) {
    setCurrentCountryCode(country.code)
    setIsCountryOpen(false)
    setCountrySearch('')
    setSelectedRegion(undefined)
    setCustomRegion('')
    onCityChange('')
    if (onCountryChange) {
      onCountryChange(country.code)
    }
  }

  // REGION HANDLERS
  function handleSelectRegion(region: RegionOption | { id: string; name: string; cities: string[] }) {
    setSelectedRegion(region)
    setCustomRegion('')
    setIsRegionOpen(false)
    setRegionSearch('')

    // If region is a city-state like Astana or Almaty or Shymkent or Baikonur:
    if (region.cities.length === 1 && region.name.toLowerCase().startsWith('город')) {
      const singleCity = region.cities[0]
      onCityChange(singleCity)
    } else {
      // If current city is not in this region, clear
      const currentNorm = normalizeCityName(city).toLowerCase()
      const hasCity = region.cities.some((c) => c.toLowerCase() === currentNorm)
      if (!hasCity) {
        onCityChange('')
      }
    }
  }

  // CITY HANDLERS
  function handleSelectCity(cityName: string) {
    const normalized = normalizeCityName(cityName)
    onCityChange(normalized)
    setIsCityOpen(false)
    setCitySearch('')

    // Auto-detect region
    const found = findRegionForCity(currentCountryCode, normalized)
    if (found && (!activeRegion || activeRegion.id !== found.id)) {
      setSelectedRegion(found)
    }
  }

  // PREPARE COUNTRY ITEMS
  const countryItems: DropdownItem[] = useMemo(() => {
    const q = countrySearch.trim().toLowerCase()
    const filtered = q
      ? countries.filter(
          (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        )
      : countries

    return filtered.map((c) => ({
      id: c.code,
      label: c.name,
      flag: c.emoji,
    }))
  }, [countries, countrySearch])

  // PREPARE REGION ITEMS
  const regionItems: DropdownItem[] = useMemo(() => {
    const q = regionSearch.trim().toLowerCase()
    const filtered = q
      ? regions.filter((r) => r.name.toLowerCase().includes(q))
      : regions

    const items: DropdownItem[] = filtered.map((r) => ({
      id: r.id,
      label: r.name,
    }))

    // If user searched for something not in predefined regions list, allow selecting custom region
    if (q && !filtered.some((r) => r.name.toLowerCase() === q)) {
      const trimmed = regionSearch.trim()
      items.unshift({
        id: `custom-${trimmed}`,
        label: `+ Использовать «${trimmed}»`,
        isCustom: true,
      })
    }

    return items
  }, [regions, regionSearch])

  // PREPARE CITY ITEMS
  const cityItems: DropdownItem[] = useMemo(() => {
    const q = citySearch.trim().toLowerCase()
    const normalizedQ = normalizeCityName(citySearch)

    const filtered = q
      ? availableCities.filter((c) => c.toLowerCase().includes(q))
      : availableCities

    const items: DropdownItem[] = filtered.map((c) => ({
      id: c,
      label: c,
    }))

    // If user searched and exact normalized city is not in the list, offer custom city option
    if (
      normalizedQ &&
      !filtered.some((c) => c.toLowerCase() === normalizedQ.toLowerCase())
    ) {
      items.unshift({
        id: `custom-${normalizedQ}`,
        label: `+ Использовать «${normalizedQ}»`,
        isCustom: true,
      })
    }

    return items
  }, [availableCities, citySearch])

  const normalizedCurrentCity = normalizeCityName(city)

  return (
    <div className="geo-select-group">
      <div
        className="form-row"
        style={{ position: 'relative', zIndex: isCountryOpen || isRegionOpen ? 30 : 2 }}
      >
        {showCountry && (
          <div
            className="geo-field"
            ref={countryRef}
            style={{ position: 'relative', zIndex: isCountryOpen ? 40 : 1 }}
          >
            <span className="field-label">Страна</span>
            <SearchableSelect
              disabled={disabled}
              valueLabel={currentCountry.name}
              placeholder="Выберите страну"
              flag={currentCountry.emoji}
              searchPlaceholder="Поиск страны…"
              searchQuery={countrySearch}
              onSearchChange={setCountrySearch}
              isOpen={isCountryOpen}
              onToggle={() => {
                setIsCountryOpen((prev) => !prev)
                setIsRegionOpen(false)
                setIsCityOpen(false)
                setCountrySearch('')
              }}
              items={countryItems}
              selectedId={currentCountryCode}
              onSelect={(item) => {
                const found = countries.find((c) => c.code === item.id)
                if (found) handleSelectCountry(found)
              }}
              zIndex={120}
              emptyText="Страна не найдена"
            />
          </div>
        )}

        <div
          className="geo-field"
          ref={regionRef}
          style={{ position: 'relative', zIndex: isRegionOpen ? 40 : 1 }}
        >
          <span className="field-label">Регион / Область</span>
          <SearchableSelect
            disabled={disabled}
            valueLabel={activeRegion ? activeRegion.name : ''}
            placeholder="Выберите регион / область"
            searchPlaceholder="Поиск региона…"
            searchQuery={regionSearch}
            onSearchChange={setRegionSearch}
            isOpen={isRegionOpen}
            onToggle={() => {
              setIsRegionOpen((prev) => !prev)
              setIsCountryOpen(false)
              setIsCityOpen(false)
              setRegionSearch('')
            }}
            items={regionItems}
            selectedId={activeRegion?.id}
            onSelect={(item) => {
              if (item.isCustom) {
                const customName = regionSearch.trim()
                setCustomRegion(customName)
                handleSelectRegion({ id: customName, name: customName, cities: [] })
              } else {
                const found = regions.find((r) => r.id === item.id)
                if (found) handleSelectRegion(found)
              }
            }}
            zIndex={110}
            emptyText="Регион не найден"
          />
        </div>
      </div>

      <div
        className="form-row"
        style={{ position: 'relative', zIndex: isCityOpen ? 30 : 1 }}
      >
        <div
          className="geo-field"
          ref={cityRef}
          style={{ position: 'relative', zIndex: isCityOpen ? 40 : 1 }}
        >
          <span className="field-label">
            {cityLabel} {required ? '*' : ''}
          </span>
          <SearchableSelect
            disabled={disabled}
            hasError={Boolean(error)}
            valueLabel={normalizedCurrentCity}
            placeholder={
              activeRegion
                ? 'Выберите город'
                : 'Сначала выберите регион или выберите город'
            }
            searchPlaceholder="Поиск города…"
            searchQuery={citySearch}
            onSearchChange={setCitySearch}
            isOpen={isCityOpen}
            onToggle={() => {
              setIsCityOpen((prev) => !prev)
              setIsCountryOpen(false)
              setIsRegionOpen(false)
              setCitySearch('')
            }}
            items={cityItems}
            selectedId={normalizedCurrentCity}
            onSelect={(item) => {
              if (item.isCustom) {
                const customName = normalizeCityName(citySearch)
                handleSelectCity(customName)
              } else {
                handleSelectCity(item.label)
              }
            }}
            zIndex={100}
            emptyText="Город не найден. Нажмите «Использовать», чтобы ввести свой"
          />
          {error && <span className="field-error">{error}</span>}
        </div>

        {children}
      </div>
    </div>
  )
}
