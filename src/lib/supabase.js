import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(
  supabaseUrl     || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession:    true,   // store session in localStorage so it survives page reload
      autoRefreshToken:  true,   // silently refresh access token before it expires
      detectSessionInUrl: true,  // handle OAuth / magic-link redirects automatically
      storageKey: 'swin-auth',   // unique key so it never conflicts with other apps
    },
  }
);
