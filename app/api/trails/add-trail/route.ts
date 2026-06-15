import { NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const difficulty = String(formData.get("difficulty") ?? "").trim();
    const duration = String(formData.get("duration") ?? "").trim();
    const distance = String(formData.get("distance") ?? "").trim();

    const image = formData.get("image");

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    if (!difficulty) {
      return NextResponse.json({ error: "Difficulty is required" }, { status: 400 });
    }

    if (!duration) {
      return NextResponse.json({ error: "Duration is required" }, { status: 400 });
    }

    if (!distance) {
      return NextResponse.json({ error: "Distance is required" }, { status: 400 });
    }

    if (!image || !(image instanceof File)) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
    }

    // Prevent duplicates by title
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("trails")
      .select("id")
      .ilike("title", title)
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }

    if (existing?.id) {
      return NextResponse.json({ error: "A trail with this title already exists" }, { status: 409 });
    }

    // Upload image to Supabase Storage
    const fileExt = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const bucket = "KulturAR-assets";
    const folder = "TRAILS";

    const storagePath = `${folder}/${fileName}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, image, {
        contentType: image.type || undefined,
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    // Public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return NextResponse.json({ error: "Failed to generate public image URL" }, { status: 500 });
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("trails")
      .insert({
        title,
        // If your schema has description, store it; otherwise remove.
        description,
        image_url: publicUrl,
        difficulty,
        duration,
        distance,
      })
      .select("id")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: inserted?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

