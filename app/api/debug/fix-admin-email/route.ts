import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    // First, verify the typo exists
    const { data: existing } = await supabaseAdmin
      .from("admin")
      .select("*")
      .eq("email", "vonnutlra@gmail.com");

    if (!existing || existing.length === 0) {
      return NextResponse.json({ message: "Email vonnutlra@gmail.com not found" });
    }

    // Update to correct email
    const { error } = await supabaseAdmin
      .from("admin")
      .update({ email: "vonnultra@gmail.com" })
      .eq("email", "vonnutlra@gmail.com");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Email corrected from vonnutlra@gmail.com to vonnultra@gmail.com" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fix email." },
      { status: 500 }
    );
  }
}
