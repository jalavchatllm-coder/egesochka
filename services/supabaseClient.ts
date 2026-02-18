import { createClient } from '@supabase/supabase-js';

// Declare process to satisfy TypeScript. Vite replaces these with string literals at build time.
declare const process: {
  env: {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
  };
};

// Access environment variables handled by Vite's define
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.");
}

// Fallback to placeholder to prevent immediate crash during initialization, 
// allows UI to show friendly error instead of blank screen.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';
};