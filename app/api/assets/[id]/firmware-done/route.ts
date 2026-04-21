import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findFirst({ where: { asset_id: id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    const fw = await prisma.firmwareMaster.findUnique({ where: { product_id: asset.product_id } });
    if (!fw) return NextResponse.json({ success: false, message: "No firmware master found" }, { status: 404 });

    const updated = await prisma.asset.update({
      where: { asset_id: id },
      data: { current_firmware: fw.latest_version, last_firmware_update_date: new Date(), last_firmware_updated_by: session.user.name, last_modified_by: session.user.name },
    });

    await prisma.auditLog.create({
      data: { asset_id: id, performed_by_user_id: session.user.id, action_type: "ASSET_FIRMWARE_UPDATED", previous_value: { firmware: asset.current_firmware } as any, new_value: { firmware: fw.latest_version } as any },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("firmware-done error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
