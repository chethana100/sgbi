import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() }) as any;
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const alerts: any[] = [];
        const today = new Date();

        // Firmware update alerts
        const assets = await prisma.asset.findMany({ where: { is_deleted: false } });
        const firmwareMasters = await prisma.firmwareMaster.findMany();
        const fwMap = new Map(firmwareMasters.map((f) => [f.product_id, f.latest_version]));

        assets.forEach((asset) => {
            const latestFw = fwMap.get(asset.product_id);
            if (latestFw && asset.current_firmware !== latestFw) {
                alerts.push({
                    type: "FIRMWARE_UPDATE",
                    asset_id: asset.asset_id,
                    asset_name: asset.product_name,
                    serial_number: asset.serial_number,
                    message: `Firmware update ${latestFw} available`,
                });
            }

            const daysSinceService = asset.last_service_date
                ? Math.floor((today.getTime() - asset.last_service_date.getTime()) / (1000 * 60 * 60 * 24))
                : null;

            if (daysSinceService !== null && daysSinceService > asset.service_reminder_interval_days) {
                alerts.push({
                    type: "SERVICE_DUE",
                    asset_id: asset.asset_id,
                    asset_name: asset.product_name,
                    serial_number: asset.serial_number,
                    message: `Service overdue by ${daysSinceService - asset.service_reminder_interval_days} days`,
                });
            }
        });

        // Pending user approvals (admin only)
        if (session.user.role === "admin") {
            const pendingUsers = await prisma.user.findMany({
                where: { approval_status: "pending" },
                select: { id: true, name: true, email: true, createdAt: true },
            });
            pendingUsers.forEach((user) => {
                alerts.push({
                    type: "PENDING_APPROVAL",
                    user_id: user.id,
                    message: `${user.name} (${user.email}) is waiting for approval`,
                });
            });
        }

        return NextResponse.json({ success: true, data: alerts });
    } catch (error) {
        console.error("GET /api/alerts error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}