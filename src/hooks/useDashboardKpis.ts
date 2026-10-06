import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// Maximum consecutive failures before the retry button is disabled (Requirement 2.7)
const MAX_RETRY_ATTEMPTS = 3

/**
 * Shape of a single row returned by the `dashboard_kpis` view.
 * All numeric columns are nullable at the DB level; the hook coerces
 * null values to 0 before surfacing them (Requirement 2.6).
 */
export interface DashboardKpis {
  total_people: number
  total_cdl_students: number
  total_staff: number
  total_volunteers: number
  total_hedzole_members: number
  total_certificates_earned: number
  networking_basics_count: number
  modern_ai_count: number
}

/**
 * Internal nullable variant — mirrors what PostgREST may actually return
 * before null-coercion is applied.
 */
type RawDashboardKpis = {
  [K in keyof DashboardKpis]: number | null
}

function coerceNulls(raw: RawDashboardKpis): DashboardKpis {
  return {
    total_people: raw.total_people ?? 0,
    total_cdl_students: raw.total_cdl_students ?? 0,
    total_staff: raw.total_staff ?? 0,
    total_volunteers: raw.total_volunteers ?? 0,
    total_hedzole_members: raw.total_hedzole_members ?? 0,
    total_certificates_earned: raw.total_certificates_earned ?? 0,
    networking_basics_count: raw.networking_basics_count ?? 0,
    modern_ai_count: raw.modern_ai_count ?? 0,
  }
}

export interface UseDashboardKpisResult {
  /** Null until the first successful fetch. */
  data: DashboardKpis | null
  isLoading: boolean
  /** Human-readable error message, or null when no error is active. */
  error: string | null
  /** Re-trigger the fetch. Has no effect when `isRetryDisabled` is true. */
  retry: () => void
  /** Number of consecutive failures since the last success (0 on initial load). */
  retryCount: number
  /** True after 3 consecutive failures; the retry button should be disabled. */
  isRetryDisabled: boolean
}

/**
 * Fetches aggregated KPI metrics from the `dashboard_kpis` Supabase view.
 *
 * - Shows a loading state while the request is in flight (Requirement 2.3).
 * - Surfaces a human-readable error and exposes a `retry` callback on failure
 *   (Requirement 2.4).
 * - Coerces null metric values to 0 (Requirement 2.6).
 * - Disables the retry action after 3 consecutive failures (Requirement 2.7).
 */
export function useDashboardKpis(): UseDashboardKpisResult {
  const [data, setData] = useState<DashboardKpis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Use a ref to track the fetch "generation" so stale responses from a
  // previous trigger are ignored if a newer one overtakes it.
  const fetchGeneration = useRef(0)

  const fetchKpis = useCallback(async (generation: number) => {
    setIsLoading(true)
    setError(null)

    const { data: rows, error: supabaseError } = await supabase
      .from('dashboard_kpis')
      .select(
        'total_people, total_cdl_students, total_staff, total_volunteers, ' +
          'total_hedzole_members, total_certificates_earned, ' +
          'networking_basics_count, modern_ai_count'
      )
      .single<RawDashboardKpis>()

    // Discard response if a newer fetch has already been triggered
    if (generation !== fetchGeneration.current) return

    setIsLoading(false)

    if (supabaseError) {
      setError(supabaseError.message)
      setRetryCount((prev) => prev + 1)
      return
    }

    if (rows) {
      setData(coerceNulls(rows))
      setRetryCount(0) // reset on success
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    const generation = ++fetchGeneration.current
    fetchKpis(generation)
  }, [fetchKpis])

  const isRetryDisabled = retryCount >= MAX_RETRY_ATTEMPTS

  const retry = useCallback(() => {
    if (isRetryDisabled) return
    const generation = ++fetchGeneration.current
    fetchKpis(generation)
  }, [isRetryDisabled, fetchKpis])

  return { data, isLoading, error, retry, retryCount, isRetryDisabled }
}
