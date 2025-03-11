// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/deploy/docs/supabase-functions

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Get the Supabase client from the request
    const supabaseClient =
      Deno.env.get("SUPABASE_URL") && Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        ? Deno.createClient(
            Deno.env.get("SUPABASE_URL") || "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
          )
        : null;

    if (!supabaseClient) {
      throw new Error("Supabase client could not be created");
    }

    // Create the study_files bucket if it doesn't exist
    const { data: buckets, error: bucketsError } =
      await supabaseClient.storage.listBuckets();

    if (bucketsError) {
      throw bucketsError;
    }

    const studyFilesBucketExists = buckets.some(
      (bucket) => bucket.name === "study_files",
    );

    if (!studyFilesBucketExists) {
      const { error: createBucketError } =
        await supabaseClient.storage.createBucket("study_files", {
          public: true,
          fileSizeLimit: 104857600, // 100MB
          allowedMimeTypes: ["*/*"],
        });

      if (createBucketError) {
        throw createBucketError;
      }
    }

    // Create the chat_images bucket if it doesn't exist
    const chatImagesBucketExists = buckets.some(
      (bucket) => bucket.name === "chat_images",
    );

    if (!chatImagesBucketExists) {
      const { error: createBucketError } =
        await supabaseClient.storage.createBucket("chat_images", {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ["image/*"],
        });

      if (createBucketError) {
        throw createBucketError;
      }
    }

    // Create the chat_files bucket if it doesn't exist
    const chatFilesBucketExists = buckets.some(
      (bucket) => bucket.name === "chat_files",
    );

    if (!chatFilesBucketExists) {
      const { error: createBucketError } =
        await supabaseClient.storage.createBucket("chat_files", {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ["*/*"],
        });

      if (createBucketError) {
        throw createBucketError;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Storage buckets created successfully",
        buckets: {
          study_files: !studyFilesBucketExists,
          chat_images: !chatImagesBucketExists,
          chat_files: !chatFilesBucketExists,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 400,
    });
  }
});
