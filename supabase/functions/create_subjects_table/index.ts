import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the subjects table
    const { error: createTableError } = await supabase.rpc(
      "create_subjects_table",
    );

    if (createTableError) {
      // If the RPC doesn't exist, create the table directly
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.subjects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL UNIQUE,
          color TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Enable RLS on subjects table
        ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

        -- Create policy for subjects
        DROP POLICY IF EXISTS "Subjects are viewable by everyone" ON public.subjects;
        CREATE POLICY "Subjects are viewable by everyone"
          ON public.subjects FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "Subjects can be created by authenticated users" ON public.subjects;
        CREATE POLICY "Subjects can be created by authenticated users"
          ON public.subjects FOR INSERT
          WITH CHECK (true);

        DROP POLICY IF EXISTS "Subjects can be updated by authenticated users" ON public.subjects;
        CREATE POLICY "Subjects can be updated by authenticated users"
          ON public.subjects FOR UPDATE
          USING (true);

        DROP POLICY IF EXISTS "Subjects can be deleted by authenticated users" ON public.subjects;
        CREATE POLICY "Subjects can be deleted by authenticated users"
          ON public.subjects FOR DELETE
          USING (true);

        -- Add realtime for subjects table
        ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
      `;

      const { error: sqlError } = await supabase.rpc("exec_sql", {
        sql: createTableSQL,
      });

      if (sqlError) {
        throw sqlError;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Subjects table created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
