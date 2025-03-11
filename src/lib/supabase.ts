import { createClient } from "@supabase/supabase-js";

// Provide default values for development
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://dcwhuihnqjipjbxunwcm.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMzA5ODU0MCwiZXhwIjoxOTI4Njc0NTQwfQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
