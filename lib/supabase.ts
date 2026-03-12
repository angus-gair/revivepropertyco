import { createClient } from '@supabase/supabase-js';

// NOTE: In a real production build, these would be import.meta.env.VITE_SUPABASE_URL
// For this environment, we use process.env or fallback to empty to allow the app to load in 'demo mode'.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => !!supabase;