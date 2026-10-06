import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonMatch {
  id: string
  full_name: string
  phone: string
}

export interface CrossReferenceSearchProps {
  onSelect: (personId: string, displayLabel: string) => void
  onRemove: (personId: string) => void
  selectedLinks: Array<{ person_id: string; label: string }>
  maxLinks?: number // default 20
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 300
const TIMEOUT_MS = 3000
const MIN_QUERY_LENGTH = 2
const DEFAULT_MAX_LINKS = 20

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CrossReferenceSearch({
  onSelect,
  onRemove,
  selectedLinks,
  maxLinks = DEFAULT_MAX_LINKS,
}: CrossReferenceSearchProps) {
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState<PersonMatch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Keep a ref to the latest abort controller so we can cancel stale requests.
  const abortRef = useRef<AbortController | null>(null)
  // Track the debounce timer.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ---------------------------------------------------------------------------
  // Close dropdown when clicking outside the component
  // ---------------------------------------------------------------------------

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ---------------------------------------------------------------------------
  // Query function
  // ---------------------------------------------------------------------------

  const runQuery = useCallback(async (query: string) => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)
    setResults([])

    // Build a timeout that both rejects the promise and aborts the fetch.
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, TIMEOUT_MS)

    try {
      const { data, error: sbError } = await supabase
        .from('people')
        .select('id, full_name, phone')
        .ilike('full_name', `%${query}%`)
        .limit(20)
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (controller.signal.aborted) return // stale response after abort

      if (sbError) {
        setError('Search failed. Please try again.')
        setIsDropdownOpen(true)
        return
      }

      setResults((data as PersonMatch[]) ?? [])
      setIsDropdownOpen(true)
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      if (controller.signal.aborted) {
        setError('The search took too long. Please try again.')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setIsDropdownOpen(true)
    } finally {
      // Only clear loading if this controller is still the current one
      if (abortRef.current === controller) {
        setIsLoading(false)
      }
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Input change handler with debounce
  // ---------------------------------------------------------------------------

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setInputValue(value)

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (value.length < MIN_QUERY_LENGTH) {
      // Cancel any in-flight request and hide dropdown
      if (abortRef.current) {
        abortRef.current.abort()
        abortRef.current = null
      }
      setIsLoading(false)
      setResults([])
      setError(null)
      setIsDropdownOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      runQuery(value)
    }, DEBOUNCE_MS)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Selection handler
  // ---------------------------------------------------------------------------

  function handleSelect(person: PersonMatch) {
    // Enforce the cap — silently ignore if at or beyond maxLinks
    if (selectedLinks.length >= maxLinks) return

    // Avoid duplicate selections
    const alreadySelected = selectedLinks.some(
      (link) => link.person_id === person.id,
    )
    if (alreadySelected) return

    const label = `${person.full_name} (${person.phone})`
    onSelect(person.id, label)
    setInputValue('')
    setIsDropdownOpen(false)
    setResults([])
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const isAtCap = selectedLinks.length >= maxLinks

  function renderDropdownContent() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Searching…</span>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span role="alert">{error}</span>
        </div>
      )
    }

    if (results.length === 0) {
      return (
        <div className="px-4 py-3 text-sm text-gray-500">
          No matching records found.
        </div>
      )
    }

    return (
      <ul role="listbox" aria-label="Search results">
        {results.map((person) => {
          const alreadySelected = selectedLinks.some(
            (link) => link.person_id === person.id,
          )
          return (
            <li
              key={person.id}
              role="option"
              aria-selected={alreadySelected}
              className={`flex cursor-pointer flex-col px-4 py-2 text-sm transition-colors ${
                alreadySelected
                  ? 'bg-purple-50 text-purple-600 cursor-default'
                  : 'hover:bg-purple-50 hover:text-purple-700 text-gray-800'
              }`}
              onClick={() => !alreadySelected && handleSelect(person)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !alreadySelected) handleSelect(person)
              }}
              tabIndex={alreadySelected ? -1 : 0}
            >
              <span className="font-medium">{person.full_name}</span>
              <span className="text-xs text-gray-500">{person.phone}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Label */}
      <label
        htmlFor="cross-reference-input"
        className="block text-sm font-medium text-gray-700"
      >
        Cross-Reference Search
        <span className="ml-1 text-xs font-normal text-gray-400">
          (link existing persons)
        </span>
      </label>

      {/* Input with search icon */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
        </div>
        <input
          id="cross-reference-input"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          aria-controls="cross-reference-dropdown"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (
              inputValue.length >= MIN_QUERY_LENGTH &&
              (results.length > 0 || error)
            ) {
              setIsDropdownOpen(true)
            }
          }}
          placeholder={
            isAtCap
              ? `Maximum ${maxLinks} links selected`
              : 'Type at least 2 characters to search…'
          }
          disabled={isAtCap}
          className={`block w-full rounded-md border py-2 pl-10 pr-4 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isAtCap
              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
              : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 hover:border-gray-400'
          }`}
        />

        {/* Inline loading indicator inside the input */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2
              className="h-4 w-4 animate-spin text-purple-500"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div
          id="cross-reference-dropdown"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
          style={{ maxWidth: containerRef.current?.offsetWidth }}
        >
          {renderDropdownContent()}
        </div>
      )}

      {/* Selected chips */}
      {selectedLinks.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Selected persons">
          {selectedLinks.map(({ person_id, label }) => (
            <span
              key={person_id}
              className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800"
            >
              {label}
              <button
                type="button"
                aria-label={`Remove ${label}`}
                onClick={() => onRemove(person_id)}
                className="ml-1 rounded-full p-0.5 text-purple-600 hover:bg-purple-200 hover:text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Cap warning */}
      {isAtCap && (
        <p className="text-xs text-amber-600" role="status">
          Maximum of {maxLinks} relationship links reached.
        </p>
      )}
    </div>
  )
}
