import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        return NextResponse.json({ success: true, data: session.user });
    } catch (error) {
        console.error("GET /api/users/me error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}