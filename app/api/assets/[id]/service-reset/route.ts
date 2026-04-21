import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findFirst({ where: { asset_id: id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    const updated = await prisma.asset.update({
      where: { asset_id: id },
      data: { last_service_date: new Date(), last_modified_by: session.user.name },
    });

    await prisma.auditLog.create({
      data: { asset_id: id, performed_by_user_id: session.user.id, action_type: "ASSET_SERVICE_RESET", previous_value: { last_service_date: asset.last_service_date } as any, new_value: { last_service_date: new Date() } as any },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("service-reset error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
