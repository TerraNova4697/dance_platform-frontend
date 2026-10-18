import PhoneInput, { type Value, type Country } from 'react-phone-number-input'
import ru from 'react-phone-number-input/locale/ru.json'
import 'react-phone-number-input/style.css'

type CountryPhoneInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  onCountryChange?: (country: Country | undefined) => void
  defaultCountry?: Country
  disabled?: boolean
  placeholder?: string
}

export function CountryPhoneInput({
  id = 'phone',
  value,
  onChange,
  onCountryChange,
  defaultCountry = 'KZ',
  disabled = false,
  placeholder = '+7 701 000 00 00',
}: CountryPhoneInputProps) {
  function handleChange(val?: Value) {
    onChange(val ? String(val) : '')
  }

  return (
    <div className="country-phone-input-wrapper">
      <PhoneInput
        id={id}
        name="phone"
        international
        withCountryCallingCode
        defaultCountry={defaultCountry}
        labels={ru}
        placeholder={placeholder}
        value={value ? (value as Value) : undefined}
        onChange={handleChange}
        onCountryChange={onCountryChange}
        disabled={disabled}
      />
    </div>
  )
}

