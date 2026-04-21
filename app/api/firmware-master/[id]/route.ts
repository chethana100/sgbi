import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await auth.api.getSession({ headers: await headers() }) as any;
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });
        const { latest_version, release_notes } = await req.json();
        if (!latest_version) return NextResponse.json({ success: false, message: "latest_version is required" }, { status: 400 });
        const firmware = await prisma.firmwareMaster.upsert({
            where: { product_id: id },
            update: { latest_version, release_notes: release_notes || null, updated_by: session.user.name },
            create: { product_id: id, latest_version, release_notes: release_notes || null, updated_by: session.user.name },
        });
        await prisma.auditLog.create({
            data: {
                performed_by_user_id: session.user.id,
                action_type: "FIRMWARE_MASTER_UPDATED",
                new_value: firmware as any,
            },
        });
        return NextResponse.json({ success: true, data: firmware });
    } catch (error) {
        console.error("PUT /api/firmware-master/:id error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}
