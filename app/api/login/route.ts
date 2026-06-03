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
    const searchEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseAdmin
      .from("admin")
      .select("*")
      .eq("email", searchEmail);

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }
    
    const adminRecord = data[0];
    const storedPassword = String((adminRecord as any).password ?? "").trim();
    const hashedPassword = hashPassword(password);

    // Accept either a SHA-256 hashed password (registration uses this)
    // or a plain-text password stored previously
    if (storedPassword !== hashedPassword && storedPassword !== password) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_session", JSON.stringify({ id: adminRecord.id, email: adminRecord.email }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Login validation failed." },
      { status: 500 }
    );
  }
}
