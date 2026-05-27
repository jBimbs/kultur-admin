import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public client: Safe for use in 'use client' components
// Using fallbacks to prevent the application from crashing if environment variables are missing
export const supabase = createClient(
  supabaseUrl || "https://eifomocplfshvfrympiu.supabase.co",
  supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZm9tb2NwbGZzaHZmcnltcGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjQxMDUsImV4cCI6MjA4MDI0MDEwNX0.hIUF54OoUUXxj9tcYfMWuP2M43s5pImL4vyH1H4dCYg"
);

// Admin client: ONLY for use in Server Components / API Routes
export const supabaseAdmin = 
  typeof window === 'undefined'
    ? createClient(
        supabaseUrl || "https://eifomocplfshvfrympiu.supabase.co",
        supabaseServiceRoleKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpZm9tb2NwbGZzaHZmcnltcGl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY2NDEwNSwiZXhwIjoyMDgwMjQwMTA1fQ.o0O8Oi96EE2V9A3AmEyIViPjv2Cb3QcUkaE1phBTN1Q",
        {
          auth: { autoRefreshToken: false, persistSession: false }
        }
      )
    : null as any;