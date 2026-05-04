import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const firmware = await prisma.firmwareMaster.findMany({
            include: { product: true },
        });

        return NextResponse.json({ success: true, data: firmware }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
    } catch (error) {
        console.error("GET /api/firmware-master error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}