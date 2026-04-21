import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const logs = await prisma.auditLog.findMany({
      where: { asset_id: id },
      orderBy: { performed_at: "desc" },
      include: { performed_by: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("history error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
