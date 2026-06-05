import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";

function hashPassword(password: string) {
  // Simple server-side hashing.
  // NOTE: This does NOT use bcrypt; it uses SHA-256 only to satisfy hashing requirement in this codebase.
  // For production, use bcrypt/argon2.
  return crypto.createHash("sha256").update(password, "utf8").digest("hex");
}

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();

    const id = body?.id;
    const first_name = body?.first_name;
    const last_name = body?.last_name;
    const suffix = body?.suffix;
    const city = body?.city;
    const email = body?.email;
    const password = body?.password;

    if (!id) {
      return NextResponse.json({ error: "Admin id is required" }, { status: 400 });
    }

    // Update profile fields
    const updatePayload: Record<string, unknown> = {
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      suffix: suffix ?? null,
      city: city ?? null,
      email: email ?? null,
    };

    const { error: updateError } = await supabaseAdmin
      .from("admin")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: `Profile update failed: ${updateError.message}` },
        { status: 400 }
      );
    }

    // Optional password update (best-effort)
    // IMPORTANT: hashing should be done server-side.
    if (password) {
      const hashedPassword = await hashPassword(password);

      const { error: passwordError } = await supabaseAdmin
        .from("admin")
        .update({ password: hashedPassword })
        .eq("id", id);

      if (passwordError) {
        return NextResponse.json(
          { error: `Password update failed: ${passwordError.message}` },
          { status: 400 }
        );
      }
    }


    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}

