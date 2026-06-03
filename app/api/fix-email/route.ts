import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { oldEmail, newEmail } = (await req.json()) as {
      oldEmail?: string;
      newEmail?: string;
    };

    if (!oldEmail || !newEmail) {
      return NextResponse.json(
        { error: "oldEmail and newEmail are required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("admin")
      .update({ email: newEmail })
      .eq("email", oldEmail);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Email updated from ${oldEmail} to ${newEmail}` });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update email." },
      { status: 500 }
    );
  }
}
