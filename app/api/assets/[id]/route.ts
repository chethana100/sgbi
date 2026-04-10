import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
  return await auth.api.getSession({ headers: await headers() });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findFirst({
      where: { asset_id: params.id, is_deleted: false },
    });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    const fw = await prisma.firmwareMaster.findUnique({ where: { product_id: asset.product_id } });
    const firmware_update_available = fw ? asset.current_firmware !== fw.latest_version : false;
    const today = new Date();
    const daysSinceService = asset.last_service_date
      ? Math.floor((today.getTime() - asset.last_service_date.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const service_due = daysSinceService !== null
      ? daysSinceService > asset.service_reminder_interval_days
      : false;

    return NextResponse.json({
      success: true,
      data: { ...asset, firmware_update_available, service_due },
    });
  } catch (error) {
    console.error("GET /api/assets/:id error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findFirst({ where: { asset_id: params.id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    const body = await req.json();
    const allowedFields = ["operational_status", "current_location_id", "customer", "remarks", "current_firmware"];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    if (updateData.current_location_id) {
      const location = await prisma.location.findUnique({ where: { location_id: updateData.current_location_id } });
      updateData.current_location_display = location?.full_path || location?.name || null;
    }

    updateData.last_modified_by = session.user.name;

    const updated = await prisma.asset.update({ where: { asset_id: params.id }, data: updateData });

    let action_type: any = "ASSET_STATUS_CHANGED";
    if (body.current_location_id) action_type = "ASSET_LOCATION_CHANGED";
    if (body.remarks) action_type = "ASSET_REMARKS_UPDATED";

    await prisma.auditLog.create({
      data: {
        asset_id: params.id,
        performed_by_user_id: session.user.id,
        action_type,
        previous_value: asset as any,
        new_value: updated as any,
        client_app_version: req.headers.get("x-app-version") || "web",
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/assets/:id error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });
    }

    const asset = await prisma.asset.findFirst({ where: { asset_id: params.id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });

    await prisma.asset.update({ where: { asset_id: params.id }, data: { is_deleted: true } });

    await prisma.auditLog.create({
      data: {
        asset_id: params.id,
        performed_by_user_id: session.user.id,
        action_type: "ASSET_STATUS_CHANGED",
        previous_value: asset as any,
        client_app_version: req.headers.get("x-app-version") || "web",
      },
    });

    return NextResponse.json({ success: true, message: "Asset deleted" });
  } catch (error) {
    console.error("DELETE /api/assets/:id error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}