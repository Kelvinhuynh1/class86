import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const cohereApiKey = "xlFXw86K7i9MrxfLDi0gcUbhcJDGaKb1d7yetkct";

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { questionId, userAnswer, correctAnswer } =
      (await req.json()) as RequestData;

    if (!questionId || !userAnswer || !correctAnswer) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Fetch the question from the database to get more context
    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .eq("id", questionId)
      .single();

    if (questionError) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch question",
          details: questionError,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Provide a simple evaluation based on keyword matching
    const userAnswerLower = userAnswer.toLowerCase();
    const correctAnswerLower = correctAnswer.toLowerCase();

    // Simple keyword matching
    const keywords = correctAnswerLower
      .split(/\s+/)
      .filter((word) => word.length > 3);
    let matchCount = 0;

    keywords.forEach((keyword) => {
      if (userAnswerLower.includes(keyword)) {
        matchCount++;
      }
    });

    const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;
    let score = 0;
    let feedback = "";

    if (matchRatio > 0.8) {
      score = 5;
      feedback =
        "Excellent answer! You've covered all the key points accurately.";
    } else if (matchRatio > 0.6) {
      score = 4;
      feedback =
        "Good answer with most key points covered. There's room for a bit more detail.";
    } else if (matchRatio > 0.4) {
      score = 3;
      feedback =
        "Partially correct. You've covered some important points, but missed others.";
    } else if (matchRatio > 0.2) {
      score = 2;
      feedback =
        "Your answer contains some relevant information but misses most key points.";
    } else {
      score = 1;
      feedback =
        "Your answer doesn't match the expected response. Review the material and try again.";
    }

    const evaluation = { score, feedback };

    // Save the evaluation to the database
    await supabase
      .from("question_responses")
      .update({
        score: evaluation.score,
        feedback: evaluation.feedback,
      })
      .eq("question_id", questionId)
      .eq("user_id", req.headers.get("x-user-id"));

    return new Response(JSON.stringify(evaluation), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in edge function:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
