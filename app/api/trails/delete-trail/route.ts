import { NextResponse } from "next/server";
// Use your admin/service_role client if you have RLS policies enabled, 
// otherwise standard supabase client is fine.
import { supabaseAdmin } from "@/lib/supabase"; 

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Trail ID is required" }, { status: 400 });
    }

    // STEP 1: Delete all associated trail stops first.
    // If you don't do this, Supabase will throw a Foreign Key error because 
    // the stops rely on the trail_id.
    const { error: stopsError } = await supabaseAdmin
      .from("trail_stops")
      .delete()
      .eq("trail_id", id);

    if (stopsError) {
      console.error("Error deleting trail stops:", stopsError);
      return NextResponse.json(
        { error: "Failed to delete associated trail stops." },
        { status: 500 }
      );
    }

    // STEP 2: Now that the stops are gone, delete the actual trail.
    const { error: trailError } = await supabaseAdmin
      .from("trails")
      .delete()
      .eq("id", id);

    if (trailError) {
      console.error("Error deleting trail:", trailError);
      return NextResponse.json({ error: trailError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Trail deleted successfully" });
    
  } catch (error: any) {
    console.error("Unexpected error in delete-trail route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}