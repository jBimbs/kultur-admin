import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const idRaw = formData.get("id");
    const name = formData.get("name");
    const description = formData.get("description");
    const cityOrigin = formData.get("city_origin");
    const imageFile = formData.get("image");

    const id = typeof idRaw === "string" ? Number(idRaw) : NaN;

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Cuisine ID is required" }, { status: 400 });
    }

    if (!name || !description || !cityOrigin) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nameStr = name.toString();
    const descriptionStr = description.toString();
    const cityOriginStr = cityOrigin.toString();

    let imageUrlToUse: string | null | undefined = undefined;

    if (imageFile && typeof imageFile !== "string") {
      const file = imageFile as File;

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 });
      }

      // Best-effort remove old image
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("cuisines")
        .select("image_url")
        .eq("id", id)
        .single();

      if (fetchErr) {
        console.error(fetchErr);
      } else if (existing?.image_url) {
        try {
          const urlParts = existing.image_url.split("/");
          const fileIndex = urlParts.findIndex(
            (part: string) => part === "KulturAR-assets"
          );
          if (fileIndex !== -1) {
            const filePath = urlParts.slice(fileIndex + 1).join("/");
            await supabaseAdmin.storage
              .from("KulturAR-assets")
              .remove([filePath]);
          }
        } catch (removeErr) {
          console.error("Failed to remove old cuisine image", removeErr);
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileName = `${Date.now()}-${file.name}`;
      const objectPath = `CUISINES/${fileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("KulturAR-assets")
        .upload(objectPath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 400 }
        );
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("KulturAR-assets")
        .getPublicUrl(objectPath);

      imageUrlToUse = urlData?.publicUrl ?? null;
    }

    const updatePayload: Record<string, unknown> = {
      name: nameStr,
      description: descriptionStr,
      city_origin: cityOriginStr,
    };

    if (imageUrlToUse !== undefined) {
      updatePayload.image_url = imageUrlToUse;
    }

    const { error: updateError } = await supabaseAdmin
      .from("cuisines")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An error occurred" },
      { status: 500 }
    );
  }
}

