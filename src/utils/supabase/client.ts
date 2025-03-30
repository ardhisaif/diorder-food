import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error(
    "VITE_SUPABASE_ANON_KEY is not defined in the environment variables."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
