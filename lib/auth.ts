import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { APIError } from "better-auth/api";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
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
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.email.endsWith("@sgbi.us")) {
            throw new APIError("FORBIDDEN", {
              message: "Authentication Failed: Only @sgbi.us email addresses are currently permitted for new SGBI enrollments.",
            });
          }
          return {
            data: {
              ...user,
              role: "field_user",
              approval_status: "pending",
            },
          };
        },
      },
    },
  },
});