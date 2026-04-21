import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({ headers: await headers() }) as any;
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ success: false, message: "Admin only" }, { status: 403 });

    const { role } = await req.json();
    if (!role || !["admin", "field_user"].includes(role)) {
      return NextResponse.json({ success: false, message: "role must be admin or field_user" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
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
        new_value: { userId: id, role } as any,
      },
    });

    // Send approval email via Brevo
    try {
      await sendEmail({
        to: updated.email,
        toName: updated.name || "User",
        subject: "Your SGBI Asset Tracker access has been approved!",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fc;">
            <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
              <h2 style="color:#111827;margin:0 0 16px;">Access Approved! 🎉</h2>
              <p style="color:#6b7280;margin:0 0 8px;">Hi ${updated.name},</p>
              <p style="color:#6b7280;margin:0 0 24px;">
                Your account for the <strong>SGBI Internal Asset Tracking System</strong> has been approved by <strong>${session.user.name}</strong>.
              </p>
              <p style="color:#6b7280;margin:0 0 24px;">
                Your role: <strong style="color:#111827;">${role === "admin" ? "Administrator" : "Field User"}</strong>
              </p>
              <a href="${process.env.BETTER_AUTH_URL}/auth/login"
                style="display:inline-block;background:#29ABE2;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">
                Sign In Now →
              </a>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
                © ${new Date().getFullYear()} SGBI · Internal Use Only
              </p>
            </div>
          </div>
        `,
      });
      console.log("Approval email sent to:", updated.email);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("approve error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
