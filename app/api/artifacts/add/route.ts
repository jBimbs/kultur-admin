import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const currentLocation = formData.get("current_location") as string;
    const imageFile = formData.get("image") as File;

    if (!name || !description || !currentLocation || !imageFile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload image to Supabase storage
    const fileName = `${Date.now()}-${imageFile.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("KulturAR-assets")
      .upload(`ARTIFACTS/${fileName}`, buffer, {
        contentType: imageFile.type,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 400 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("KulturAR-assets")
      .getPublicUrl(`ARTIFACTS/${fileName}`);

    const imageUrl = urlData?.publicUrl;

    // Insert into database
    const { error: dbError } = await supabaseAdmin
      .from("artifacts")
      .insert([
        {
          name,
          description,
          current_location: currentLocation,
          image_url: imageUrl,
        },
      ]);

    if (dbError) {
      return NextResponse.json(
        { error: `Database insert failed: ${dbError.message}` },
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
