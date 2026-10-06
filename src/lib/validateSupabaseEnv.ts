/**
 * Validates that the Supabase environment variables are present and non-empty.
 *
 * Exported as a standalone function so it can be unit-tested independently
 * of the Supabase client instantiation. The check is also called at module
 * load time in `supabase.ts` so the app halts before any data operation when
 * credentials are absent (Requirements 1.5, 1.6).
 */
export function validateSupabaseEnv(
  url: string | undefined,
  key: string | undefined
): void {
  if (!url || url.trim() === '') {
    throw new Error(
      'Missing Supabase configuration: VITE_SUPABASE_URL is not set. ' +
        'Add it to your .env file (see .env.example) and restart the dev server.'
    )
  }

  if (!key || key.trim() === '') {
    throw new Error(
      'Missing Supabase configuration: VITE_SUPABASE_ANON_KEY is not set. ' +
        'Add it to your .env file (see .env.example) and restart the dev server.'
    )
  }
}
