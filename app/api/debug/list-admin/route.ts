import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      count: data?.length || 0,
      records: data?.map(r => ({ 
        email: r.email, 
        password: r.password,
        first_name: r.first_name,
        last_name: r.last_name
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch records." },
      { status: 500 }
    );
  }
}
