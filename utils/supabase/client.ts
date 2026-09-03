import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabase = () => {
  if (!cachedClient) {
    cachedClient = createBrowserClient(supabaseUrl!, supabaseKey!);
  }
  return cachedClient;
};

export const createClient = () => getSupabase();