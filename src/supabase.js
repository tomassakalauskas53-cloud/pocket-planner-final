import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

function initializeSupabase() {
  if (!url || !key?.startsWith('sb_publishable_')) return null

  try {
    if (new URL(url).protocol !== 'https:') return null
    return createClient(url, key)
  } catch {
    return null
  }
}

export const supabase = initializeSupabase()
