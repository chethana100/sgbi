import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findFirst({ where: { asset_id: params.id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });

    const fileName = params.id + "/" + Date.now() + "-" + file.name;
    const buffer = await file.arrayBuffer();

    const { error } = await supabase.storage.from("asset-images").upload(fileName, buffer, { contentType: file.type });
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from("asset-images").getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    const updated = await prisma.asset.update({
      where: { asset_id: params.id },
      data: { image_urls: { push: publicUrl }, last_modified_by: session.user.name },
    });

    await prisma.auditLog.create({
      data: { asset_id: params.id, performed_by_user_id: session.user.id, action_type: "ASSET_IMAGE_UPLOADED", new_value: { url: publicUrl } as any },
    });

    return NextResponse.json({ success: true, data: { url: publicUrl, asset: updated } });
  } catch (error) {
    console.error("image upload error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findFirst({ where: { asset_id: params.id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ success: false, message: "URL required" }, { status: 400 });

    const updated = await prisma.asset.update({
      where: { asset_id: params.id },
      data: { image_urls: asset.image_urls.filter((u) => u !== url), last_modified_by: session.user.name },
    });

    await prisma.auditLog.create({
      data: { asset_id: params.id, performed_by_user_id: session.user.id, action_type: "ASSET_IMAGE_DELETED", previous_value: { url } as any },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("image delete error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
