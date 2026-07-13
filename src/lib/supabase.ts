import { createClient } from '@supabase/supabase-js';

// Helper to prevent bundlers/compilers from statically inlining process.env at build-time
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set. ' +
    'Using placeholder credentials to prevent build-time/compilation crashes.'
  );
}

export const isSupabaseConfigured = (): boolean => {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder')
  );
};

// Singleton Supabase client — used by both server (API routes) and client components
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url-for-build.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const withTimeout = <T = any>(promise: any, timeoutMs: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out')), timeoutMs)
    ),
  ]);
};
