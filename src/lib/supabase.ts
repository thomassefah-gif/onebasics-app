import { createClient } from '@supabase/supabase-js';

// Get raw values from environment
let rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
let anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean up the URL formatting automatically
rawUrl = rawUrl.trim();
if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}
// Strip /rest/v1/ if user accidentally copied it from Supabase Data API settings
rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

anonKey = anonKey.trim();

console.log('Connecting to Supabase at URL:', rawUrl);

export const supabase = createClient(rawUrl, anonKey);