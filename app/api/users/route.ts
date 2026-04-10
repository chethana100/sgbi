import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() }) as any;

        console.log("SESSION DATA:", JSON.stringify(session));

        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }
        if (status) where.approval_status = status;

        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    approval_status: true,
                    approved_by: true,
                    approved_at: true,
                    last_login_at: true,
                    createdAt: true,
                },
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            success: true,
            data: users,
            meta: { page, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize) },
        });

    } catch (error) {
        console.error("GET /api/users error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}