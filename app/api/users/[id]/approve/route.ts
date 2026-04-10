import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() }) as any;
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

    const { role } = await req.json();
    if (!role || !["admin", "field_user"].includes(role)) {
      return NextResponse.json({ success: false, message: "role must be admin or field_user" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        approval_status: "approved",
        role,
        approved_by: session.user.name,
        approved_at: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        performed_by_user_id: session.user.id,
        action_type: "USER_APPROVED",
        new_value: { userId: params.id, role } as any,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("approve error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
