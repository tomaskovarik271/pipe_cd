// import { createClient } from '@supabase/supabase-js'; // Revert this if needed
import { createBrowserClient } from '@supabase/ssr'; // Use ssr package again

// Define Database types (sync with backend context/migrations)
// TODO: Generate these types using 'supabase gen types typescript --local > lib/db-types.ts'
//       and import them properly here.
interface Database { public: { /* ... your DB types ... */ } }

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables.');
}

// Use createBrowserClient for client-side usage with @supabase/ssr
export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
); 