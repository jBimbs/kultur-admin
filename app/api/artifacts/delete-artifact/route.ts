import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as { id?: number };

    if (!id) {
      return NextResponse.json(
        { error: "Artifact ID is required" },
        { status: 400 }
      );
    }

    // First, get the artifact to retrieve the image_url
    const { data: artifact, error: fetchError } = await supabaseAdmin
      .from("artifacts")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError || !artifact) {
      return NextResponse.json(
        { error: "Artifact not found" },
        { status: 404 }
      );
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from("artifacts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to delete artifact: ${deleteError.message}` },
        { status: 400 }
      );
    }

    // Try to delete the image from storage if it exists
    if (artifact.image_url) {
      try {
        // Extract the file path from the URL
        // URL format: https://[project].supabase.co/storage/v1/object/public/KulturAR-assets/ARTIFACTS/[filename]
        const urlParts = artifact.image_url.split("/");
        const fileIndex = urlParts.findIndex((part: string) => part === "KulturAR-assets");
        if (fileIndex !== -1) {
          const filePath = urlParts.slice(fileIndex + 1).join("/");
          await supabaseAdmin.storage
            .from("KulturAR-assets")
            .remove([filePath]);
        }
      } catch (storageError) {
        // Log but don't fail if image deletion fails
        console.error("Failed to delete image from storage:", storageError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An error occurred" },
      { status: 500 }
    );
  }
}
