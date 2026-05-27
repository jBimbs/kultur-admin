import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET_NAME = "KulturAR-assets";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name")?.toString() ?? "";
    const description = formData.get("description")?.toString() ?? "";
    const city = formData.get("city")?.toString() ?? "";
    const category = formData.get("category")?.toString() ?? "";
    const latitude = Number(formData.get("latitude")?.toString());
    const longitude = Number(formData.get("longitude")?.toString());
    const file = formData.get("image") as File | null;

    if (!name || !description || !city || !category || Number.isNaN(latitude) || Number.isNaN(longitude) || !file) {
      return NextResponse.json({ error: "All site fields are required." }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop() ?? "jpg";
    const fileName = `historical-site-${Date.now()}.${fileExt}`;
    const filePath = `SITES/${fileName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 400 });
    }

    const { data: publicUrlData, error: urlError } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (urlError) {
      return NextResponse.json({ error: `Failed to get uploaded image URL: ${urlError.message}` }, { status: 400 });
    }

    const image_url = publicUrlData.publicUrl;

    const { error } = await supabaseAdmin.from("sites").insert([
      {
        name: name.trim(),
        description: description.trim(),
        city: city.trim(),
        Category: category.trim(),
        latitude,
        longitude,
        image_url,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to create site." }, { status: 500 });
  }
}
