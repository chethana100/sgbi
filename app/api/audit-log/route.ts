import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() }) as any;
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "50");
        const asset_id = searchParams.get("asset_id") || "";
        const user_id = searchParams.get("user_id") || "";
        const action_type = searchParams.get("action_type") || "";
        const date_from = searchParams.get("date_from") || "";
        const date_to = searchParams.get("date_to") || "";

        const where: any = {};
        if (asset_id) where.asset_id = asset_id;
        if (user_id) where.performed_by_user_id = user_id;
        if (action_type) where.action_type = action_type;
        if (date_from || date_to) {
            where.performed_at = {};
            if (date_from) where.performed_at.gte = new Date(date_from);
            if (date_to) where.performed_at.lte = new Date(date_to);
        }

        const [logs, totalCount] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { performed_at: "desc" },
                include: { performed_by: { select: { name: true, email: true } } },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: logs,
            meta: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
        });
    } catch (error) {
        console.error("GET /api/audit-log error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}