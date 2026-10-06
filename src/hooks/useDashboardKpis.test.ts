/**
 * Unit tests for useDashboardKpis hook
 *
 * Tests:
 *   - null metric coercion → values rendered as 0 (Requirement 2.6)
 *   - retry counter → isRetryDisabled becomes true after 3 failures (Requirement 2.7)
 *   - a 4th retry call after disablement makes no additional network request
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDashboardKpis } from './useDashboardKpis'

// ---------------------------------------------------------------------------
// Mock the Supabase client — use vi.hoisted so the factory references are
// available at hoist time (before any imports are resolved).
// ---------------------------------------------------------------------------
const { mockSingle, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockSelect = vi.fn(() => ({ single: mockSingle }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))
  return { mockSingle, mockFrom }
})

vi.mock('../lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a valid raw KPI row where every metric is non-null. */
function makeRawRow(overrides: Record<string, number | null> = {}) {
  return {
    total_people: 10,
    total_cdl_students: 5,
    total_staff: 3,
    total_volunteers: 2,
    total_hedzole_members: 1,
    total_certificates_earned: 7,
    networking_basics_count: 4,
    modern_ai_count: 2,
    ...overrides,
  }
}

/** Make Supabase respond with a successful data row. */
function resolveWith(data: Record<string, number | null>) {
  mockSingle.mockResolvedValueOnce({ data, error: null })
}

/** Make Supabase respond with an error. */
function rejectWith(message = 'network error') {
  mockSingle.mockResolvedValueOnce({ data: null, error: { message } })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDashboardKpis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  it('starts in a loading state with no data and no error', async () => {
    resolveWith(makeRawRow())
    const { result } = renderHook(() => useDashboardKpis())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  // ── Successful fetch ───────────────────────────────────────────────────────

  it('populates data and clears loading/error on a successful fetch', async () => {
    resolveWith(makeRawRow())
    const { result } = renderHook(() => useDashboardKpis())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.data).not.toBeNull()
    expect(result.current.data?.total_people).toBe(10)
  })

  // ── Null coercion (Requirement 2.6) ────────────────────────────────────────

  it('coerces null metric values to 0', async () => {
    resolveWith(
      makeRawRow({
        total_people: null,
        total_cdl_students: null,
        total_staff: null,
        total_volunteers: null,
        total_hedzole_members: null,
        total_certificates_earned: null,
        networking_basics_count: null,
        modern_ai_count: null,
      })
    )

    const { result } = renderHook(() => useDashboardKpis())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const d = result.current.data!
    expect(d.total_people).toBe(0)
    expect(d.total_cdl_students).toBe(0)
    expect(d.total_staff).toBe(0)
    expect(d.total_volunteers).toBe(0)
    expect(d.total_hedzole_members).toBe(0)
    expect(d.total_certificates_earned).toBe(0)
    expect(d.networking_basics_count).toBe(0)
    expect(d.modern_ai_count).toBe(0)
  })

  it('coerces a mix of null and non-null values — only null fields become 0', async () => {
    resolveWith(
      makeRawRow({
        total_people: 42,
        networking_basics_count: null,
        modern_ai_count: null,
      })
    )

    const { result } = renderHook(() => useDashboardKpis())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const d = result.current.data!
    expect(d.total_people).toBe(42)
    expect(d.networking_basics_count).toBe(0)
    expect(d.modern_ai_count).toBe(0)
  })

  // ── Error state ────────────────────────────────────────────────────────────

  it('sets error message and leaves data null on a failed fetch', async () => {
    rejectWith('connection refused')
    const { result } = renderHook(() => useDashboardKpis())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('connection refused')
    expect(result.current.data).toBeNull()
  })

  // ── Retry counter (Requirement 2.7) ────────────────────────────────────────

  it('increments retryCount by 1 for each consecutive failure', async () => {
    rejectWith()
    const { result } = renderHook(() => useDashboardKpis())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.retryCount).toBe(1)

    rejectWith()
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.retryCount).toBe(2)

    rejectWith()
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.retryCount).toBe(3)
  })

  it('isRetryDisabled becomes true after 3 consecutive failures', async () => {
    // Initial fetch (failure 1)
    rejectWith()
    const { result } = renderHook(() => useDashboardKpis())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isRetryDisabled).toBe(false)

    // Failure 2
    rejectWith()
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isRetryDisabled).toBe(false)

    // Failure 3 — threshold reached
    rejectWith()
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isRetryDisabled).toBe(true)
  })

  it('a 4th retry call after disablement makes no additional network request', async () => {
    // Initial fetch (failure 1)
    rejectWith()
    const { result } = renderHook(() => useDashboardKpis())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Failure 2
    rejectWith()
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Failure 3 — retry now disabled
    rejectWith()
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isRetryDisabled).toBe(true)
    const callsBefore = mockSingle.mock.calls.length

    // 4th attempt — must be a no-op
    act(() => { result.current.retry() })
    await act(async () => {})

    expect(mockSingle.mock.calls.length).toBe(callsBefore)
    expect(result.current.isRetryDisabled).toBe(true)
  })

  it('resets retryCount to 0 after a successful fetch following failures', async () => {
    // Failure 1
    rejectWith()
    const { result } = renderHook(() => useDashboardKpis())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Failure 2
    rejectWith()
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.retryCount).toBe(2)

    // Success
    resolveWith(makeRawRow())
    act(() => { result.current.retry() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.retryCount).toBe(0)
    expect(result.current.isRetryDisabled).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
