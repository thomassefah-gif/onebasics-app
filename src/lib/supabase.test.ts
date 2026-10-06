import { describe, it, expect } from 'vitest'
import { validateSupabaseEnv } from './validateSupabaseEnv'

/**
 * Tests for the Supabase environment variable validator.
 *
 * `validateSupabaseEnv` is called at module load time in supabase.ts, so the
 * app halts before any data operation when credentials are absent
 * (Requirements 1.5, 1.6). Testing the pure validation function directly
 * avoids re-importing side-effectful modules.
 */
describe('validateSupabaseEnv', () => {
  // --- VITE_SUPABASE_URL checks ---

  it('throws when VITE_SUPABASE_URL is undefined', () => {
    expect(() => validateSupabaseEnv(undefined, 'valid-key')).toThrow(
      'VITE_SUPABASE_URL is not set'
    )
  })

  it('throws when VITE_SUPABASE_URL is an empty string', () => {
    expect(() => validateSupabaseEnv('', 'valid-key')).toThrow(
      'VITE_SUPABASE_URL is not set'
    )
  })

  it('throws when VITE_SUPABASE_URL is whitespace only', () => {
    expect(() => validateSupabaseEnv('   ', 'valid-key')).toThrow(
      'VITE_SUPABASE_URL is not set'
    )
  })

  // --- VITE_SUPABASE_ANON_KEY checks ---

  it('throws when VITE_SUPABASE_ANON_KEY is undefined', () => {
    expect(() =>
      validateSupabaseEnv('https://test.supabase.co', undefined)
    ).toThrow('VITE_SUPABASE_ANON_KEY is not set')
  })

  it('throws when VITE_SUPABASE_ANON_KEY is an empty string', () => {
    expect(() => validateSupabaseEnv('https://test.supabase.co', '')).toThrow(
      'VITE_SUPABASE_ANON_KEY is not set'
    )
  })

  it('throws when VITE_SUPABASE_ANON_KEY is whitespace only', () => {
    expect(() => validateSupabaseEnv('https://test.supabase.co', '  ')).toThrow(
      'VITE_SUPABASE_ANON_KEY is not set'
    )
  })

  // --- Happy path ---

  it('does not throw when both env vars are valid non-empty strings', () => {
    expect(() =>
      validateSupabaseEnv('https://test.supabase.co', 'valid-anon-key')
    ).not.toThrow()
  })
})
