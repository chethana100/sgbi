import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
    return await auth.api.getSession({ headers: await headers() });
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const products = await prisma.product.findMany({
            where: { is_active: true },
            orderBy: { product_name: "asc" },
        });

        return NextResponse.json({ success: true, data: products }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
    } catch (error) {
        console.error("GET /api/products error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession() as any;
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

        const body = await req.json();
        const { product_name, product_type, erp_part_number, description, serial_prefix } = body;

        if (!product_name || !product_type || !erp_part_number) {
            return NextResponse.json({ success: false, message: "product_name, product_type and erp_part_number are required" }, { status: 400 });
        }

        const existing = await prisma.product.findUnique({ where: { erp_part_number } });
        if (existing) return NextResponse.json({ success: false, message: "ERP part number already exists" }, { status: 409 });

        const product = await prisma.product.create({
            data: { product_name, product_type, erp_part_number, description, serial_prefix },
        });

        await prisma.auditLog.create({
            data: {
                performed_by_user_id: session.user.id,
                action_type: "PRODUCT_ADDED",
                new_value: product as any,
            },
        });

        return NextResponse.json({ success: true, data: product }, { status: 201 });
    } catch (error) {
        console.error("POST /api/products error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}