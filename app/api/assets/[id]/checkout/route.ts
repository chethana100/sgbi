import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const asset = await prisma.asset.findFirst({ where: { asset_id: id, is_deleted: false } });
    if (!asset) return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    if (asset.checked_out_to_user_id) return NextResponse.json({ success: false, message: "Asset is already checked out" }, { status: 409 });

    const { purpose, expected_return_date } = await req.json();

    const checkout = await prisma.checkoutRecord.create({
      data: { asset_id: id, checked_out_by_user_id: session.user.id, purpose: purpose || null, expected_return_date: expected_return_date ? new Date(expected_return_date) : null },
    });

    await prisma.asset.update({
      where: { asset_id: id },
      data: { checked_out_to_user_id: session.user.id, checked_out_at: new Date(), checked_out_purpose: purpose || null, last_modified_by: session.user.name },
    });

    await prisma.auditLog.create({
      data: { asset_id: id, performed_by_user_id: session.user.id, action_type: "ASSET_CHECKED_OUT", new_value: { checked_out_to: session.user.name, purpose } as any },
    });

    return NextResponse.json({ success: true, data: checkout });
  } catch (error) {
    console.error("checkout error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
