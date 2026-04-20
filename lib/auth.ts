import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
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
        const result = await resend.emails.send({
          from: "SGBI Asset Tracker <onboarding@resend.dev>",
          to: user.email,
          subject: "Reset your SGBI password",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #1a1f36;">Reset your password</h2>
              <p>Hi ${user.name},</p>
              <p>Click the button below to reset your password:</p>
              <a href="${url}" style="display:inline-block;background:#4169e1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
                Reset Password
              </a>
              <p style="color:#999;font-size:12px;">This link expires in 30 minutes.</p>
            </div>
          `,
        });
        console.log("Email sent:", result);
      } catch (error) {
        console.error("Email error:", error);
      }
    },
  },
});
