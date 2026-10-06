/**
 * usePeople — paginated fetch of all registered people with sub-profile flags.
 *
 * - Fetches 50 records per page from `public.people` ordered by `full_name`
 *   ascending using `.range(from, to)` (Requirements 12.1, 12.8).
 * - For each person, derives boolean presence flags for every sub-profile type
 *   (staff_profiles, hedzole_profiles, volunteer_profiles, cdl_students)
 *   (Requirement 12.3).
 * - Surfaces `isLoading`, `error`, `retry`, `currentPage`, `totalCount`, and
 *   `goToPage` for consumer components (Requirements 12.6, 12.7, 12.8).
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of records per page (Requirement 12.1, 12.8). */
export const PAGE_SIZE = 50

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A person record enriched with boolean flags indicating which sub-profiles
 * are linked to this person.
 */
export interface PersonWithProfiles {
  id: string
  full_name: string
  gender: string
  phone: string
  email: string | null
  profiles: {
    has_staff: boolean
    has_hedzole: boolean
    has_volunteer: boolean
    has_cdl: boolean
  }
}

export interface UsePeopleResult {
  /** The people on the current page, enriched with profile flags. */
  people: PersonWithProfiles[]
  isLoading: boolean
  /** Human-readable error message, or null when there is no active error. */
  error: string | null
  /** 1-based current page number. */
  currentPage: number
  /**
   * Total number of matching people records in the database.
   * Populated from the PostgREST `count` header.  `null` until the first
   * successful fetch.
   */
  totalCount: number | null
  /** Re-trigger the fetch for the current page. */
  retry: () => void
  /** Navigate to a specific 1-based page number. */
  goToPage: (page: number) => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated slice of the `people` table and augments each row with
 * sub-profile presence flags.
 *
 * Usage:
 * ```tsx
 * const { people, isLoading, error, currentPage, totalCount, retry, goToPage } = usePeople()
 * ```
 */
export function usePeople(): UsePeopleResult {
  const [people, setPeople] = useState<PersonWithProfiles[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState<number | null>(null)

  // Fetch-generation counter prevents stale responses from overtaking a newer
  // request triggered by page navigation or a retry.
  const fetchGeneration = useRef(0)

  const fetchPage = useCallback(async (page: number, generation: number) => {
    setIsLoading(true)
    setError(null)

    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    // Fetch the people slice with embedded sub-profile presence via PostgREST
    // "exists" semantics: select only the id column from each related table so
    // Supabase returns an array (possibly empty) for each relationship.
    const { data: rows, error: fetchError, count } = await supabase
      .from('people')
      .select(
        `id,
         full_name,
         gender,
         phone,
         email,
         staff_profiles(id),
         hedzole_profiles(id),
         volunteer_profiles(id),
         cdl_students(id)`,
        { count: 'exact' }
      )
      .order('full_name', { ascending: true })
      .range(from, to)

    // Discard response if a newer fetch has already been triggered.
    if (generation !== fetchGeneration.current) return

    setIsLoading(false)

    if (fetchError) {
      setError(fetchError.message)
      return
    }

    if (count !== null) {
      setTotalCount(count)
    }

    const enriched: PersonWithProfiles[] = (rows ?? []).map((row) => {
      // PostgREST returns the related rows as arrays; an empty array means no
      // linked record exists, a non-empty array means one or more exist.
      const staffArr = row.staff_profiles as { id: string }[] | null
      const hedzoleArr = row.hedzole_profiles as { id: string }[] | null
      const volunteerArr = row.volunteer_profiles as { id: string }[] | null
      const cdlArr = row.cdl_students as { id: string }[] | null

      return {
        id: row.id as string,
        full_name: row.full_name as string,
        gender: row.gender as string,
        phone: row.phone as string,
        email: row.email as string | null,
        profiles: {
          has_staff: Array.isArray(staffArr) && staffArr.length > 0,
          has_hedzole: Array.isArray(hedzoleArr) && hedzoleArr.length > 0,
          has_volunteer: Array.isArray(volunteerArr) && volunteerArr.length > 0,
          has_cdl: Array.isArray(cdlArr) && cdlArr.length > 0,
        },
      }
    })

    setPeople(enriched)
  }, [])

  // Fetch on mount and whenever the current page changes.
  useEffect(() => {
    const generation = ++fetchGeneration.current
    fetchPage(currentPage, generation)
  }, [currentPage, fetchPage])

  const retry = useCallback(() => {
    const generation = ++fetchGeneration.current
    fetchPage(currentPage, generation)
  }, [currentPage, fetchPage])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  return {
    people,
    isLoading,
    error,
    currentPage,
    totalCount,
    retry,
    goToPage,
  }
}
