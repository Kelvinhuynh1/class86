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

    // Parse request body
    const { roomId, userId } = await req.json();

    if (!roomId) {
      throw new Error("Room ID is required");
    }

    // Get the room to check ownership
    const { data: room, error: roomError } = await supabase
      .from("game_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError) {
      throw roomError;
    }

    // Check if user is the creator of the room
    if (userId && room.created_by !== userId) {
      throw new Error("Only the creator can delete this room");
    }

    // Delete all messages associated with the room first
    const { error: messagesError } = await supabase
      .from("game_messages")
      .delete()
      .eq("room_id", roomId);

    if (messagesError) {
      console.error("Error deleting messages:", messagesError);
      // Continue with room deletion even if message deletion fails
    }

    // Delete the room
    const { error: deleteError } = await supabase
      .from("game_rooms")
      .delete()
      .eq("id", roomId);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Game room deleted successfully",
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
