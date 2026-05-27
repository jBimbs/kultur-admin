import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, password, city } = body as {
      first_name?: string;
      last_name?: string;
      email?: string;
      password?: string;
      city?: string;
    };

    if (!first_name || !last_name || !email || !password || !city) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
          first_name,
          last_name,
          email,
          password: hashedPassword,
          city,
        },
      ]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: userData?.user ?? null });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
