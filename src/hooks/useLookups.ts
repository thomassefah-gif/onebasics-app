import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CohortRow, CertificateRow } from '../types/database'

// ---------------------------------------------------------------------------
// Shared return type
// ---------------------------------------------------------------------------

export interface UseLookupResult<T> {
  /** Empty array until the first successful fetch. */
  data: T[]
  isLoading: boolean
  /** Human-readable error message, or null when no error is active. */
  error: string | null
  /** Re-trigger the fetch. */
  retry: () => void
}

// ---------------------------------------------------------------------------
// Internal generic fetcher
// ---------------------------------------------------------------------------

/**
 * Creates a hook that fetches all rows from `tableName`, ordered by `name`
 * ascending (Requirements 14.1–14.5).
 *
 * - Displays a loading indicator while the fetch is in flight (Req 14.1, 14.2).
 * - Surfaces a human-readable error on failure and exposes `retry` so the
 *   dependent input can be re-enabled after a successful retry (Req 14.3).
 * - Returns an empty array (not null) when the table has no rows, so the
 *   calling component can distinguish "empty" from "not yet loaded" via
 *   `isLoading` and render a "no options available" message (Req 14.4).
 * - Values are always sourced from the Supabase_Client, never hardcoded (Req 14.5).
 */
function createLookupHook<T extends { id: string; name: string }>(
  tableName: 'cohorts' | 'certificates'
): () => UseLookupResult<T> {
  return function useLookup(): UseLookupResult<T> {
    const [data, setData] = useState<T[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Increment to trigger a re-fetch without re-mounting
    const [retryToken, setRetryToken] = useState(0)

    const fetchData = useCallback(async () => {
      setIsLoading(true)
      setError(null)

      const { data: rows, error: supabaseError } = await supabase
        .from(tableName)
        .select('id, name')
        .order('name', { ascending: true })

      setIsLoading(false)

      if (supabaseError) {
        setError(supabaseError.message)
        return
      }

      setData((rows as T[]) ?? [])
    }, []) // eslint-disable-line react-hooks/exhaustive-deps — tableName is stable (closure)

    // Run on mount and on every manual retry
    useEffect(() => {
      fetchData()
    }, [fetchData, retryToken]) // retryToken change re-runs the effect

    const retry = useCallback(() => {
      setRetryToken((prev) => prev + 1)
    }, [])

    return { data, isLoading, error, retry }
  }
}

// ---------------------------------------------------------------------------
// Public hooks
// ---------------------------------------------------------------------------

/**
 * Fetches all rows from the `cohorts` lookup table, ordered by name ascending.
 *
 * Usage:
 * ```tsx
 * const { data: cohorts, isLoading, error, retry } = useCohorts()
 * ```
 *
 * Requirements: 10.2, 10.3, 14.1, 14.3, 14.4, 14.5
 */
export const useCohorts: () => UseLookupResult<CohortRow> =
  createLookupHook<CohortRow>('cohorts')

/**
 * Fetches all rows from the `certificates` lookup table, ordered by name ascending.
 *
 * Usage:
 * ```tsx
 * const { data: certificates, isLoading, error, retry } = useCertificates()
 * ```
 *
 * Requirements: 10.4, 10.5, 14.2, 14.3, 14.4, 14.5
 */
export const useCertificates: () => UseLookupResult<CertificateRow> =
  createLookupHook<CertificateRow>('certificates')
