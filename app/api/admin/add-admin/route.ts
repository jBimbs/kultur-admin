import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      city,
      first_name,
      last_name,
      suffix,
      email,
      password,
    } = body as {
      city?: string;
      first_name?: string;
      last_name?: string;
      suffix?: string;
      email?: string;
      password?: string;
    };

    if (!city || !first_name || !last_name || !email || !password) {
      return NextResponse.json({ error: "All required fields are required." }, { status: 400 });
    }

    const { data: userData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const hashedPassword = createHash("sha256").update(password).digest("hex");

    const { error: insertError } = await supabaseAdmin
      .from("admin")
      .insert([
        {
          city,
          first_name,
          last_name,
          suffix: suffix || null,
          email,
          password: hashedPassword,
        },
      ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: userData?.user ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to create admin." }, { status: 500 });
  }
}

