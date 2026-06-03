import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("admin_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    
    // Fetch full admin data from database
    const { data, error } = await supabaseAdmin
      .from("admin")
      .select("id, email, first_name, last_name, city")
      .eq("id", session.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }
}
