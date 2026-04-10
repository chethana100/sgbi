import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
    return await auth.api.getSession({ headers: await headers() }) as any;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

        const product = await prisma.product.findUnique({ where: { product_id: params.id } });
        if (!product) return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });

        const body = await req.json();
        const updated = await prisma.product.update({
            where: { product_id: params.id },
            data: {
                product_name: body.product_name ?? product.product_name,
                description: body.description ?? product.description,
                serial_prefix: body.serial_prefix ?? product.serial_prefix,
                is_active: body.is_active ?? product.is_active,
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("PATCH /api/products/:id error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

        const product = await prisma.product.findUnique({ where: { product_id: params.id } });
        if (!product) return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });

        await prisma.product.update({
            where: { product_id: params.id },
            data: { is_active: false },
        });

        return NextResponse.json({ success: true, message: "Product deactivated" });
    } catch (error) {
        console.error("DELETE /api/products/:id error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}