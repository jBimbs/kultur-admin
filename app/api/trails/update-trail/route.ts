import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const idRaw = formData.get("id");
    const id = Number(idRaw);

    if (!id || !Number.isFinite(id)) {
      return NextResponse.json({ error: "Valid trail ID is required" }, { status: 400 });
    }

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const difficulty = String(formData.get("difficulty") ?? "").trim();
    const duration = String(formData.get("duration") ?? "").trim();
    const distance = String(formData.get("distance") ?? "").trim();

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });
    if (!difficulty) return NextResponse.json({ error: "Difficulty is required" }, { status: 400 });
    if (!duration) return NextResponse.json({ error: "Duration is required" }, { status: 400 });
    if (!distance) return NextResponse.json({ error: "Distance is required" }, { status: 400 });

    const image = formData.get("image");

    const trailStopsRaw = formData.get("trailStops");
    const trailStopsJson = typeof trailStopsRaw === "string" ? trailStopsRaw : "";

    if (!trailStopsJson) {
      return NextResponse.json({ error: "trailStops are required" }, { status: 400 });
    }

    const trailStops = JSON.parse(trailStopsJson) as Array<{
      site_id: number;
      site_name: string;
      notes: string;
    }>;

    if (!Array.isArray(trailStops) || trailStops.length === 0) {
      return NextResponse.json({ error: "At least one stop is required" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
    }

    // Update base trail fields
    const updatePayload: any = {
      title,
      description,
      difficulty,
      duration,
      distance,
    };

    // Optional image update
    if (image && image instanceof File) {
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

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) {
        return NextResponse.json({ error: "Failed to generate public image URL" }, { status: 500 });
      }

      updatePayload.image_url = publicUrl;
    }

    const { error: trailErr } = await supabaseAdmin.from("trails").update(updatePayload).eq("id", id);
    if (trailErr) {
      return NextResponse.json({ error: trailErr.message }, { status: 500 });
    }

    // Replace stops: delete existing then insert
    const { error: stopsDeleteErr } = await supabaseAdmin
      .from("trail_stops")
      .delete()
      .eq("trail_id", id);

    if (stopsDeleteErr) {
      return NextResponse.json({ error: stopsDeleteErr.message }, { status: 500 });
    }

    // UPDATED: Added stop_order based on the array index
    const insertRows = trailStops.map((s, index) => ({
      trail_id: id,
      site_id: s.site_id,
      notes: s.notes ?? "",
      stop_order: index + 1, 
    }));

    const { error: stopsInsertErr } = await supabaseAdmin
      .from("trail_stops")
      .insert(insertRows);

    if (stopsInsertErr) {
      return NextResponse.json({ error: stopsInsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}