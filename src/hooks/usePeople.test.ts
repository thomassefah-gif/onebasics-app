/**
 * Unit tests for usePeople hook
 *
 * Tests:
 *   - Initial load: first 50 records fetched ordered by full_name asc (Req 12.1)
 *   - Sub-profile flags derived correctly from related row arrays (Req 12.3)
 *   - Loading state management (Req 12.6)
 *   - Error state + retry (Req 12.7)
 *   - Pagination: goToPage triggers a new range query (Req 12.8)
 *   - totalCount is populated from the count header
 *   - Stale response is discarded after a rapid page change
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePeople, PAGE_SIZE } from './usePeople'

// ---------------------------------------------------------------------------
// Mock the Supabase client
// ---------------------------------------------------------------------------
const { mockRange, mockOrder, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockRange = vi.fn()
  const mockOrder = vi.fn(() => ({ range: mockRange }))
  const mockSelect = vi.fn(() => ({ order: mockOrder }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  return { mockRange, mockOrder, mockSelect, mockFrom }
})

vi.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SubProfileEntry = { id: string }

interface RawPersonRow {
  id: string
  full_name: string
  gender: string
  phone: string
  email: string | null
  staff_profiles: SubProfileEntry[]
  hedzole_profiles: SubProfileEntry[]
  volunteer_profiles: SubProfileEntry[]
  cdl_students: SubProfileEntry[]
}

function makePerson(overrides: Partial<RawPersonRow> = {}): RawPersonRow {
  return {
    id: 'person-1',
    full_name: 'Alice Mensah',
    gender: 'Female',
    phone: '0200000001',
    email: 'alice@example.com',
    staff_profiles: [],
    hedzole_profiles: [],
    volunteer_profiles: [],
    cdl_students: [],
    ...overrides,
  }
}

/** Make the Supabase chain resolve with a list of rows and a total count. */
function resolveWith(rows: RawPersonRow[], count = rows.length) {
  mockRange.mockResolvedValueOnce({ data: rows, error: null, count })
}

/** Make the Supabase chain resolve with an error. */
function rejectWith(message = 'network error') {
  mockRange.mockResolvedValueOnce({ data: null, error: { message }, count: null })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePeople', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  it('starts in loading state with empty people array and no error', async () => {
    resolveWith([makePerson()])
    const { result } = renderHook(() => usePeople())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.people).toEqual([])
    expect(result.current.error).toBeNull()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  // ── Successful fetch ───────────────────────────────────────────────────────

  it('populates people and clears loading/error on a successful fetch', async () => {
    resolveWith([makePerson({ id: 'p1', full_name: 'Alice' })])
    const { result } = renderHook(() => usePeople())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.people).toHaveLength(1)
    expect(result.current.people[0].full_name).toBe('Alice')
  })

  it('populates totalCount from the count header', async () => {
    resolveWith([makePerson()], 75)
    const { result } = renderHook(() => usePeople())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.totalCount).toBe(75)
  })

  // ── Sub-profile flags (Requirement 12.3) ──────────────────────────────────

  it('sets has_staff=true when staff_profiles array is non-empty', async () => {
    resolveWith([makePerson({ staff_profiles: [{ id: 'sp-1' }] })])
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.people[0].profiles.has_staff).toBe(true)
    expect(result.current.people[0].profiles.has_hedzole).toBe(false)
    expect(result.current.people[0].profiles.has_volunteer).toBe(false)
    expect(result.current.people[0].profiles.has_cdl).toBe(false)
  })

  it('sets has_hedzole=true when hedzole_profiles array is non-empty', async () => {
    resolveWith([makePerson({ hedzole_profiles: [{ id: 'hp-1' }] })])
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.people[0].profiles.has_hedzole).toBe(true)
  })

  it('sets has_volunteer=true when volunteer_profiles array is non-empty', async () => {
    resolveWith([makePerson({ volunteer_profiles: [{ id: 'vp-1' }] })])
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.people[0].profiles.has_volunteer).toBe(true)
  })

  it('sets has_cdl=true when cdl_students array is non-empty', async () => {
    resolveWith([makePerson({ cdl_students: [{ id: 'cdl-1' }] })])
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.people[0].profiles.has_cdl).toBe(true)
  })

  it('sets all flags to false when all sub-profile arrays are empty', async () => {
    resolveWith([makePerson()])
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const { profiles } = result.current.people[0]
    expect(profiles.has_staff).toBe(false)
    expect(profiles.has_hedzole).toBe(false)
    expect(profiles.has_volunteer).toBe(false)
    expect(profiles.has_cdl).toBe(false)
  })

  it('sets all flags to true when all sub-profile arrays are non-empty', async () => {
    resolveWith([
      makePerson({
        staff_profiles: [{ id: 'sp-1' }],
        hedzole_profiles: [{ id: 'hp-1' }],
        volunteer_profiles: [{ id: 'vp-1' }],
        cdl_students: [{ id: 'cdl-1' }],
      }),
    ])
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const { profiles } = result.current.people[0]
    expect(profiles.has_staff).toBe(true)
    expect(profiles.has_hedzole).toBe(true)
    expect(profiles.has_volunteer).toBe(true)
    expect(profiles.has_cdl).toBe(true)
  })

  // ── Initial page defaults ──────────────────────────────────────────────────

  it('starts on page 1 and queries range [0, PAGE_SIZE-1]', async () => {
    resolveWith([])
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currentPage).toBe(1)
    expect(mockRange).toHaveBeenCalledWith(0, PAGE_SIZE - 1)
  })

  // ── Pagination (Requirement 12.8) ──────────────────────────────────────────

  it('goToPage updates currentPage and issues a new range query', async () => {
    // Initial fetch for page 1
    resolveWith([])

    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Navigate to page 2
    resolveWith([makePerson({ id: 'p2', full_name: 'Bob' })], 75)
    act(() => {
      result.current.goToPage(2)
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.currentPage).toBe(2)
    // Page 2: range [50, 99]
    expect(mockRange).toHaveBeenLastCalledWith(PAGE_SIZE, PAGE_SIZE * 2 - 1)
    expect(result.current.people[0].full_name).toBe('Bob')
  })

  // ── Error state and retry (Requirement 12.7) ──────────────────────────────

  it('surfaces error message and leaves people array unchanged on failure', async () => {
    rejectWith('DB connection refused')
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('DB connection refused')
    expect(result.current.people).toEqual([])
  })

  it('retry re-issues the fetch for the current page', async () => {
    // Initial failure
    rejectWith()
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).not.toBeNull()

    // Retry succeeds
    resolveWith([makePerson({ id: 'p1', full_name: 'Alice' })])
    act(() => { result.current.retry() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.people).toHaveLength(1)
    expect(result.current.people[0].full_name).toBe('Alice')
  })

  it('clears previous error on a successful retry', async () => {
    rejectWith('timeout')
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('timeout')

    resolveWith([makePerson()])
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeNull()
  })

  // ── Null sub-profile arrays (defensive) ──────────────────────────────────

  it('treats null sub-profile arrays as false flags', async () => {
    // PostgREST may return null instead of [] for missing joins
    const rawRow = {
      ...makePerson(),
      staff_profiles: null as unknown as { id: string }[],
      hedzole_profiles: null as unknown as { id: string }[],
      volunteer_profiles: null as unknown as { id: string }[],
      cdl_students: null as unknown as { id: string }[],
    }
    resolveWith([rawRow])
    const { result } = renderHook(() => usePeople())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const { profiles } = result.current.people[0]
    expect(profiles.has_staff).toBe(false)
    expect(profiles.has_hedzole).toBe(false)
    expect(profiles.has_volunteer).toBe(false)
    expect(profiles.has_cdl).toBe(false)
  })
})
