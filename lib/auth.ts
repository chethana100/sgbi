import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  advanced: {
    cookiePrefix: "sgbi",
    cookies: {
      session_token: {
        attributes: {
          secure: true,
          sameSite: "none",
        },
      },
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "field_user",
      },
      approval_status: {
        type: "string",
        required: false,
        defaultValue: "pending",
      },
    },
  },
  trustedOrigins: ["https://sgbi-xqft.vercel.app", "https://sgbi.vercel.app", "http://localhost:3000"],
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      console.log("Sending reset email to:", user.email);
      console.log("Reset URL:", url);
      try {
        await sendEmail({
          to: user.email,
          toName: user.name || "User",
          subject: "Reset your SGBI password",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fc;">
              <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e5e7eb;">
                <h2 style="color:#111827;margin:0 0 16px;">Reset your password</h2>
                <p style="color:#6b7280;">Hi ${user.name},</p>
                <p style="color:#6b7280;">Click below to reset your password. This link expires in 30 minutes.</p>
                <a href="${url}" style="display:inline-block;background:#29ABE2;color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;margin:16px 0;">
                  Reset Password →
                </a>
                <p style="color:#9ca3af;font-size:12px;">If you did not request this, ignore this email.</p>
              </div>
            </div>
          `,
        });
      } catch (error) {
        console.error("Email error:", error);
      }
    },
  },
});
