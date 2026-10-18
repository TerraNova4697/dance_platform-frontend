import { useEffect, useState, type ReactNode } from 'react'
import {
  CountrySelect,
  StateSelect,
  CitySelect,
  GetCountries,
  GetState,
} from 'react-country-state-city'
import 'react-country-state-city/dist/react-country-state-city.css'

export type GeoCountry = {
  id: number
  name: string
  iso2: string
  phone_code?: string
  emoji?: string
  hasStates?: boolean
}

export type GeoState = {
  id: number
  name: string
  state_code?: string
  hasCities?: boolean
}

export type GeoCity = {
  id: number
  name: string
  latitude?: string
  longitude?: string
}

const TypedCountrySelect = CountrySelect as unknown as React.ComponentType<{
  defaultValue?: GeoCountry | string
  containerClassName?: string
  inputClassName?: string
  onChange?: (e: GeoCountry) => void
  onTextChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeHolder?: string
  showFlag?: boolean
  region?: string
  src?: string
}>

const TypedStateSelect = StateSelect as unknown as React.ComponentType<{
  countryid: number
  defaultValue?: GeoState | string
  containerClassName?: string
  inputClassName?: string
  onChange?: (e: GeoState) => void
  onTextChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeHolder?: string
  src?: string
}>

const TypedCitySelect = CitySelect as unknown as React.ComponentType<{
  countryid: number
  stateid: number
  defaultValue?: GeoCity | string
  containerClassName?: string
  inputClassName?: string
  onChange?: (e: GeoCity) => void
  onTextChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeHolder?: string
  src?: string
}>

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
  const [countryId, setCountryId] = useState<number>(112)
  const [stateId, setStateId] = useState<number>(0)
  const [selectedCountry, setSelectedCountry] = useState<GeoCountry | undefined>()

  // Sync countryCode from parent (e.g. from CountryPhoneInput or context)
  useEffect(() => {
    let active = true
    async function resolveCountry() {
      try {
        const countries = await GetCountries()
        if (!active) return
        const match = (countries as GeoCountry[]).find(
          (c) => c.iso2.toUpperCase() === (countryCode || 'KZ').toUpperCase()
        )
        if (match) {
          setCountryId(match.id)
          setSelectedCountry(match)
        }
      } catch {
        // Keep fallback
      }
    }
    void resolveCountry()
    return () => {
      active = false
    }
  }, [countryCode])

  // Try to pre-detect state if city was already populated from profile context
  useEffect(() => {
    let active = true
    async function resolveStateFromCity() {
      if (!city || stateId !== 0 || !countryId) return
      try {
        const states = (await GetState(countryId)) as GeoState[]
        if (!active) return
        const cityLower = city.trim().toLowerCase()
        const match = states.find((s) => {
          const sName = s.name.toLowerCase()
          return sName === cityLower || sName.includes(cityLower) || cityLower.includes(sName)
        })
        if (match) {
          setStateId(match.id)
        }
      } catch {
        // Ignore fallback
      }
    }
    void resolveStateFromCity()
    return () => {
      active = false
    }
  }, [countryId, city, stateId])

  function handleCountryChange(e: GeoCountry) {
    setCountryId(e.id)
    setSelectedCountry(e)
    setStateId(0)
    onCityChange('')
    if (onCountryChange && e.iso2) {
      onCountryChange(e.iso2)
    }
  }

  function handleStateChange(e: GeoState) {
    setStateId(e.id)
    onCityChange('')
  }

  function handleCityChange(e: GeoCity) {
    if (e && e.name) {
      onCityChange(e.name)
    }
  }

  return (
    <div className="geo-select-group">
      <div className="form-row">
        {showCountry && (
          <div className="geo-field">
            <span className="field-label">Страна</span>
            <div className={`geo-select-wrapper ${disabled ? 'is-disabled' : ''}`}>
              <TypedCountrySelect
                key={`country-${selectedCountry?.id ?? countryId}`}
                defaultValue={selectedCountry}
                onChange={handleCountryChange}
                placeHolder="Выберите страну"
                showFlag={true}
              />
            </div>
          </div>
        )}

        <div className="geo-field">
          <span className="field-label">Регион / Область</span>
          <div className={`geo-select-wrapper ${disabled ? 'is-disabled' : ''}`}>
            <TypedStateSelect
              key={`state-${countryId}`}
              countryid={countryId}
              onChange={handleStateChange}
              placeHolder="Выберите регион / область"
            />
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="geo-field">
          <span className="field-label">
            {cityLabel} {required ? '*' : ''}
          </span>
          <div
            className={`geo-select-wrapper ${disabled ? 'is-disabled' : ''} ${
              error ? 'has-error' : ''
            }`}
          >
            <TypedCitySelect
              key={`city-${countryId}-${stateId}`}
              countryid={countryId}
              stateid={stateId}
              defaultValue={city ? { id: 0, name: city, latitude: '', longitude: '' } : undefined}
              onChange={handleCityChange}
              onTextChange={(e) => onCityChange(e.target.value)}
              placeHolder={
                stateId ? 'Выберите или введите город' : 'Сначала выберите регион или введите город'
              }
            />
          </div>
          {error && <span className="field-error">{error}</span>}
        </div>

        {children}
      </div>
    </div>
  )
}
