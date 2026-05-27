import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("admin")
      .select("password")
      .eq("email", email)
      .limit(1)
      .single();

    if (error || !data || typeof data.password !== "string") {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const hashedPassword = hashPassword(password);

    if (data.password !== hashedPassword) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Login validation failed." },
      { status: 500 }
    );
  }
}
