import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are not set. Make sure they are defined in your environment.');
}

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not set. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are defined in your environment.');
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
};