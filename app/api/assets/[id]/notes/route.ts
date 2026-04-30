import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { note } = await req.json();
    if (!note?.trim()) return NextResponse.json({ success: false, message: "Note is required" }, { status: 400 });

    const asset = await prisma.asset.findFirst({ where: { asset_id: id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    await prisma.auditLog.create({
      data: {
        asset_id: id,
        performed_by_user_id: session.user.id,
        action_type: "ASSET_REMARKS_UPDATED",
        notes: note,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("note error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
