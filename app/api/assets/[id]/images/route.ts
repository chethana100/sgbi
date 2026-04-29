import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, message: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const asset = await prisma.asset.findFirst({ where: { asset_id: id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Auto resize: max 1200px width, convert to webp for smaller size
    const resizedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const fileName = `${id}/${Date.now()}.webp`;

    const { error } = await supabase.storage
      .from("asset-images")
      .upload(fileName, resizedBuffer, { contentType: "image/webp" });

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from("asset-images").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    const updated = await prisma.asset.update({
      where: { asset_id: id },
      data: {
        image_urls: { push: publicUrl },
        last_modified_by: session.user.name,
      },
    });

    await prisma.auditLog.create({
      data: {
        asset_id: id,
        performed_by_user_id: session.user.id,
        action_type: "ASSET_IMAGE_UPLOADED",
        new_value: { url: publicUrl } as any,
      },
    });

    return NextResponse.json({ success: true, data: { url: publicUrl, asset: updated } });
  } catch (error) {
    console.error("image upload error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, message: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const asset = await prisma.asset.findFirst({ where: { asset_id: id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, message: "URL required" }, { status: 400 });

    const updated = await prisma.asset.update({
      where: { asset_id: id },
      data: {
        image_urls: asset.image_urls.filter((u) => u !== url),
        last_modified_by: session.user.name,
      },
    });

    await prisma.auditLog.create({
      data: {
        asset_id: id,
        performed_by_user_id: session.user.id,
        action_type: "ASSET_IMAGE_DELETED",
        previous_value: { url } as any,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("image delete error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
