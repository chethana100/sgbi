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

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const resizedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const fileName = `products/${id}.webp`;
    await supabase.storage.from("asset-images").remove([fileName]);
    const { error } = await supabase.storage.from("asset-images").upload(fileName, resizedBuffer, { contentType: "image/webp" });
    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    const { data: urlData } = supabase.storage.from("asset-images").getPublicUrl(fileName);
    const updated = await prisma.product.update({
      where: { product_id: id },
      data: { image: urlData.publicUrl },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("product image upload error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
