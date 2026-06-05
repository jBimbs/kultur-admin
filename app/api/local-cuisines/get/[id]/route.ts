import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Cuisine ID is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("cuisines")
      .select("id, name, description, city_origin, image_url")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Cuisine not found" }, { status: 404 });
    }

    return NextResponse.json({ cuisine: data, success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

