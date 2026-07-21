// ============================================================================
// Supabase Edge Function: delete-viewed-snap
// Deletes media file from storage and purges record from DB upon snap view.
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  snap_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Initialize user-context client to verify caller identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized user session", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const { snap_id }: RequestPayload = await req.json();

    if (!snap_id) {
      return new Response(
        JSON.stringify({ error: "snap_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Initialize Service Role client for elevated cleanup operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Fetch target snap record to verify recipient ownership
    const { data: snap, error: snapError } = await supabaseAdmin
      .from("snaps")
      .select("id, recipient_id, media_url")
      .eq("id", snap_id)
      .single();

    if (snapError || !snap) {
      return new Response(
        JSON.stringify({ error: "Snap not found or already deleted" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Strict Security Guard: Only the designated recipient can trigger snap deletion
    if (snap.recipient_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You are not the recipient of this snap" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Extract storage file path from media_url
    // Expected format: .../snaps-media/user_id/snap_file.jpg or user_id/snap_file.jpg
    const storageBucket = "snaps-media";
    let filePath = snap.media_url;

    if (snap.media_url.includes(`${storageBucket}/`)) {
      filePath = snap.media_url.split(`${storageBucket}/`)[1];
    }

    // 6. Delete media asset from Supabase Storage
    const { error: storageDeleteError } = await supabaseAdmin.storage
      .from(storageBucket)
      .remove([filePath]);

    if (storageDeleteError) {
      console.error(`[Storage Warning] Failed to delete file ${filePath}:`, storageDeleteError.message);
    }

    // 7. Purge snap database record permanently
    const { error: dbDeleteError } = await supabaseAdmin
      .from("snaps")
      .delete()
      .eq("id", snap_id);

    if (dbDeleteError) {
      return new Response(
        JSON.stringify({ error: "Failed to delete snap DB record", details: dbDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        snap_id,
        message: "Snap media and metadata successfully purged",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err?.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
