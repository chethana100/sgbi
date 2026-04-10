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

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const locations = await prisma.location.findMany({
            where: { is_active: true },
            orderBy: { name: "asc" },
        });

        // Build nested tree
        const map = new Map<string, any>();
        const roots: any[] = [];

        locations.forEach((loc) => map.set(loc.location_id, { ...loc, children: [] }));
        locations.forEach((loc) => {
            if (loc.parent_location_id) {
                const parent = map.get(loc.parent_location_id);
                if (parent) parent.children.push(map.get(loc.location_id));
            } else {
                roots.push(map.get(loc.location_id));
            }
        });

        return NextResponse.json({ success: true, data: roots });
    } catch (error) {
        console.error("GET /api/locations error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

        const { name, parent_location_id } = await req.json();
        if (!name) return NextResponse.json({ success: false, message: "name is required" }, { status: 400 });

        const location = await prisma.location.create({
            data: {
                name,
                parent_location_id: parent_location_id || null,
                created_by: session.user.name,
                full_path: "",
            },
        });

        // Compute and update full path
        const full_path = await computeFullPath(location.location_id);
        const updated = await prisma.location.update({
            where: { location_id: location.location_id },
            data: { full_path },
        });

        await prisma.auditLog.create({
            data: {
                performed_by_user_id: session.user.id,
                action_type: "LOCATION_ADDED",
                new_value: updated as any,
            },
        });

        return NextResponse.json({ success: true, data: updated }, { status: 201 });
    } catch (error) {
        console.error("POST /api/locations error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}