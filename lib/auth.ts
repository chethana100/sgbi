import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

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
    expiresIn: 60 * 60 * 8,        // 8 hours (as per SRD)
    updateAge: 60 * 60,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
});