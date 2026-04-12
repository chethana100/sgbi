import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findFirst({ where: { asset_id: params.id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    if (!asset.checked_out_to_user_id) return NextResponse.json({ success: false, message: "Asset is not checked out" }, { status: 409 });

    const openCheckout = await prisma.checkoutRecord.findFirst({
      where: { asset_id: params.id, checked_in_at: null },
      orderBy: { checked_out_at: "desc" },
    });

    if (openCheckout) {
      await prisma.checkoutRecord.update({
        where: { checkout_id: openCheckout.checkout_id },
        data: { checked_in_by_user_id: session.user.id, checked_in_at: new Date() },
      });
    }

    await prisma.asset.update({
      where: { asset_id: params.id },
      data: { checked_out_to_user_id: null, checked_out_at: null, checked_out_purpose: null, last_modified_by: session.user.name },
    });

    await prisma.auditLog.create({
      data: { asset_id: params.id, performed_by_user_id: session.user.id, action_type: "ASSET_CHECKED_IN", new_value: { checked_in_by: session.user.name } as any },
    });

    return NextResponse.json({ success: true, message: "Asset checked in successfully" });
  } catch (error) {
    console.error("checkin error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
