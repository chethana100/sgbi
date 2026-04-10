import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
    return await auth.api.getSession({ headers: await headers() }) as any;
}

async function computeFullPath(locationId: string): Promise<string> {
    const parts: string[] = [];
    let currentId: string | null = locationId;
    while (currentId) {
        const loc: any = await prisma.location.findUnique({ where: { location_id: currentId } });
        if (!loc) break;
        parts.unshift(loc.name);
        currentId = loc.parent_location_id;
    }
    return parts.join(" › ");
}

async function updateDescendantPaths(locationId: string) {
    const children = await prisma.location.findMany({ where: { parent_location_id: locationId } });
    for (const child of children) {
        const full_path = await computeFullPath(child.location_id);
        await prisma.location.update({ where: { location_id: child.location_id }, data: { full_path } });
        await updateDescendantPaths(child.location_id);
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

        const { name } = await req.json();
        if (!name) return NextResponse.json({ success: false, message: "name is required" }, { status: 400 });

        const updated = await prisma.location.update({
            where: { location_id: params.id },
            data: { name },
        });

        const full_path = await computeFullPath(params.id);
        await prisma.location.update({ where: { location_id: params.id }, data: { full_path } });
        await updateDescendantPaths(params.id);

        await prisma.auditLog.create({
            data: {
                performed_by_user_id: session.user.id,
                action_type: "LOCATION_EDITED",
                new_value: { ...updated, full_path } as any,
            },
        });

        return NextResponse.json({ success: true, data: { ...updated, full_path } });
    } catch (error) {
        console.error("PATCH /api/locations/:id error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

        const assetsAtLocation = await prisma.asset.count({
            where: { current_location_id: params.id, is_deleted: false },
        });

        if (assetsAtLocation > 0) {
            return NextResponse.json({
                success: false,
                message: `Cannot deactivate — ${assetsAtLocation} asset(s) are assigned to this location. Reassign them first.`,
            }, { status: 409 });
        }

        await prisma.location.update({
            where: { location_id: params.id },
            data: { is_active: false },
        });

        return NextResponse.json({ success: true, message: "Location deactivated" });
    } catch (error) {
        console.error("DELETE /api/locations/:id error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}