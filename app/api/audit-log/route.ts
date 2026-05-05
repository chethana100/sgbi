import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const assetId = searchParams.get("asset_id");
    const actionType = searchParams.get("action_type");
    const locationFilter = searchParams.get("location") || "";

    const where: any = {
      action_type: {
        in: [
          "ASSET_FIRMWARE_UPDATED",
          "ASSET_SERVICE_RESET",
          "ASSET_STATUS_CHANGED",
          "ASSET_LOCATION_CHANGED",
          "ASSET_ENROLLED",
          "ASSET_REMARKS_UPDATED",
          "FIRMWARE_MASTER_UPDATED"
        ]
      }
    };

    if (assetId) where.asset_id = assetId;
    if (actionType) where.action_type = actionType;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { performed_at: "desc" },
      take: pageSize * 3, // fetch more to allow client filtering
      skip: (page - 1) * pageSize,
      include: {
        performed_by: { select: { name: true, email: true } },
        asset: { select: { product_name: true, serial_number: true, current_location_display: true } },
      },
    });

    // Filter by location if specified
    const filtered = locationFilter
      ? logs.filter(l => l.asset?.current_location_display?.includes(locationFilter))
      : logs;

    return NextResponse.json({ success: true, data: filtered.slice(0, pageSize) });
  } catch (error) {
    console.error("audit log error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
