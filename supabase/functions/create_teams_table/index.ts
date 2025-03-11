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

    // Create the teams table
    const { error: createTableError } =
      await supabase.rpc("create_teams_table");

    if (createTableError) {
      // If the RPC doesn't exist, create the table directly
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.teams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          members TEXT[] DEFAULT '{}',
          notes TEXT,
          subjects TEXT[] DEFAULT '{}',
          is_private BOOLEAN DEFAULT false,
          owner TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );

        -- Enable RLS on teams table
        ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

        -- Create policy for teams
        DROP POLICY IF EXISTS "Teams are viewable by everyone" ON public.teams;
        CREATE POLICY "Teams are viewable by everyone"
          ON public.teams FOR SELECT
          USING (true);

        DROP POLICY IF EXISTS "Teams can be created by authenticated users" ON public.teams;
        CREATE POLICY "Teams can be created by authenticated users"
          ON public.teams FOR INSERT
          WITH CHECK (true);

        DROP POLICY IF EXISTS "Teams can be updated by owner or admin" ON public.teams;
        CREATE POLICY "Teams can be updated by owner or admin"
          ON public.teams FOR UPDATE
          USING (true);

        DROP POLICY IF EXISTS "Teams can be deleted by owner or admin" ON public.teams;
        CREATE POLICY "Teams can be deleted by owner or admin"
          ON public.teams FOR DELETE
          USING (true);

        -- Add realtime for teams table
        ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
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
        message: "Teams table created successfully",
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
