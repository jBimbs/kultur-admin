import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: "Festival ID is required." }, { status: 400 });
    }

    const updatePayload: any = {
      name: body.name?.trim() || null,
      description: body.description?.trim() || null,
      city: body.city?.trim() || null,
      month_celebrated: body.month_celebrated?.trim() || null,
    };

    const { error } = await supabaseAdmin
      .from("festivals")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
