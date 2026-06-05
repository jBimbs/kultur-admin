import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const idRaw = formData.get("id");
    const name = formData.get("name");
    const description = formData.get("description");
    const currentLocation = formData.get("current_location");
    const imageFile = formData.get("image");

    const id = typeof idRaw === "string" ? Number(idRaw) : NaN;

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Artifact ID is required" }, { status: 400 });
    }

    if (!name || !description || !currentLocation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const nameStr = name.toString();
    const descriptionStr = description.toString();
    const currentLocationStr = currentLocation.toString();

    // If file is provided, upload to storage.
    // If not provided, keep existing image_url.
    let imageUrlToUse: string | null | undefined = undefined;

    // Added safety check: Ensure imageFile is an actual File instance and has a real size
    if (imageFile && typeof imageFile !== "string" && imageFile instanceof File && imageFile.size > 0) {
      const file = imageFile as File;

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image size must be less than 5MB" },
          { status: 400 }
        );
      }

      // Best-effort removal of the old image asset
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from("artifacts")
        .select("image_url")
        .eq("id", id)
        .single();

      if (fetchErr) {
        console.error("Error fetching existing artifact image url:", fetchErr);
      } else if (existing?.image_url) {
        try {
          const urlParts = existing.image_url.split("/");
          const fileIndex = urlParts.findIndex((part: string) => part === "KulturAR-assets");
          
          if (fileIndex !== -1) {
            // Reconstructs 'ARTIFACTS/filename.jpg'
            const filePath = urlParts.slice(fileIndex + 1).join("/");
            
            await supabaseAdmin.storage
              .from("KulturAR-assets")
              .remove([filePath]);
          }
        } catch (removeErr) {
          console.error("Failed to remove old artifact image:", removeErr);
        }
      }

      // Read file contents as buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate clean path to prevent dynamic resolution bugs
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const objectPath = `ARTIFACTS/${fileName}`;

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
      current_location: currentLocationStr,
    };

    if (imageUrlToUse !== undefined) {
      updatePayload.image_url = imageUrlToUse;
    }

    const { error: updateError } = await supabaseAdmin
      .from("artifacts")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: `Database update failed: ${updateError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}