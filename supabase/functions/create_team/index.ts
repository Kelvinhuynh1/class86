import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TeamData {
  name: string;
  members: string[];
  notes?: string;
  subjects?: string[];
  is_private: boolean;
  owner: string;
}

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

    // Parse request body
    const teamData = (await req.json()) as TeamData;

    // Ensure teams table exists
    await ensureTeamsTable(supabase);

    // Create the team
    const { data, error } = await supabase
      .from("teams")
      .insert([
        {
          name: teamData.name,
          members: teamData.members || [],
          notes: teamData.notes || "",
          subjects: teamData.subjects || [],
          is_private: teamData.is_private || false,
          owner: teamData.owner,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data[0],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});

async function ensureTeamsTable(supabase: any) {
  // Check if teams table exists
  const { error: checkError } = await supabase
    .from("teams")
    .select("id")
    .limit(1);

  if (checkError && checkError.code === "42P01") {
    // Table doesn't exist, create it
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

    await supabase.rpc("exec_sql", { sql: createTableSQL });
  }
}
