import { useState, useEffect, useRef } from 'react'
import type { CatalogItem } from '../api/onboarding'

type DebouncedSearchSelectProps = {
  id: string
  label: string
  value: string
  selectedTitle?: string
  placeholder?: string
  onChange: (name: string, title: string) => void
  fetchOptions: (query: string) => Promise<CatalogItem[]>
  debounceMs?: number
  disabled?: boolean
  required?: boolean
  error?: string
}

export function DebouncedSearchSelect({
  id,
  label,
  value,
  selectedTitle = '',
  placeholder = 'Начните вводить для поиска…',
  onChange,
  fetchOptions,
  debounceMs = 1000,
  disabled = false,
  required = false,
  error,
}: DebouncedSearchSelectProps) {
  const [query, setQuery] = useState(selectedTitle)
  const [prevSelectedTitle, setPrevSelectedTitle] = useState(selectedTitle)
  const [options, setOptions] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // Adjust state during render when selectedTitle prop changes
  if (selectedTitle !== prevSelectedTitle) {
    setPrevSelectedTitle(selectedTitle)
    setQuery(selectedTitle)
  }

  // Debounced search on query changes (only within async timer)
  useEffect(() => {
    if (!query.trim() || query.trim() === selectedTitle.trim()) {
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await fetchOptions(query.trim())
        setOptions(results)
        setHasSearched(true)
        setIsOpen(true)
      } catch {
        setOptions([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      clearTimeout(timer)
    }
  }, [query, debounceMs, fetchOptions, selectedTitle])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleInputChange(text: string) {
    setQuery(text)
    if (!text.trim()) {
      setOptions([])
      setLoading(false)
      setHasSearched(false)
      setIsOpen(false)
      onChange('', '')
    }
  }

  function handleSelect(item: CatalogItem) {
    onChange(item.name, item.title)
    setQuery(item.title)
    setIsOpen(false)
  }

  function handleClear() {
    onChange('', '')
    setQuery('')
    setOptions([])
    setHasSearched(false)
    setIsOpen(false)
  }

  return (
    <div className="debounced-select-wrapper" ref={containerRef}>
      <label htmlFor={id} className="field-label">
        {label} {required ? '*' : ''}
      </label>

      <div className={`debounced-input-container ${error ? 'has-error' : ''}`}>
        <input
          id={id}
          type="text"
          className="debounced-search-input"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (options.length > 0) setIsOpen(true)
          }}
          autoComplete="off"
        />

        <div className="debounced-input-tools">
          {loading && <span className="debounced-spinner" aria-label="Поиск…" />}
          {value && !disabled && (
            <button
              type="button"
              className="debounced-clear-btn"
              onClick={handleClear}
              aria-label="Очистить выбор"
              title="Очистить"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {error && <span className="field-error">{error}</span>}

      {isOpen && (
        <ul className="debounced-dropdown-menu" role="listbox">
          {options.length > 0 ? (
            options.map((opt) => {
              const isSelected = opt.name === value
              return (
                <li
                  key={opt.name}
                  role="option"
                  aria-selected={isSelected}
                  className={`debounced-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span>{opt.title}</span>
                  {isSelected && <span className="checkmark">✓</span>}
                </li>
              )
            })
          ) : hasSearched && !loading ? (
            <li className="debounced-dropdown-empty">Ничего не найдено</li>
          ) : null}
        </ul>
      )}
    </div>
  )
}

