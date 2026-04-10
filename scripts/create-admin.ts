/**
 * Create or promote first admin user script.
 * Run: npx tsx scripts/create-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// --- CONFIGURE THIS ---
const ADMIN_EMAIL = "admin@sgbi.us";
const ADMIN_NAME = "SGBI Admin";
const ADMIN_PASSWORD = "Admin@1234"; // Change this after first login!
// ----------------------

function hashPassword(password: string): string {
  // better-auth uses scrypt - but since this is a seed, we'll create via better-auth's
  // account model directly using a simple bcrypt-compatible approach.
  // We'll create the user record and a corresponding account record.
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🔍 Checking for existing admin users...");

  const existingAdmin = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
  });

  if (existingAdmin) {
    console.log(`⚠️  User '${ADMIN_EMAIL}' already exists.`);
    console.log(`   Current role: ${existingAdmin.role}`);
    console.log(`   Approval status: ${existingAdmin.approval_status}`);

    if (existingAdmin.role !== "admin" || existingAdmin.approval_status !== "approved") {
      // Promote to admin
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          role: "admin",
          approval_status: "approved",
        },
      });
      console.log(`✅ User '${ADMIN_EMAIL}' has been promoted to admin and approved.`);
    } else {
      console.log(`✅ User '${ADMIN_EMAIL}' is already an admin. No changes needed.`);
    }
  } else {
    console.log(`✨ Creating new admin user: ${ADMIN_EMAIL}`);
    const userId = crypto.randomUUID();

    // Create the User record
    await prisma.user.create({
      data: {
        id: userId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        emailVerified: true,
        role: "admin",
        approval_status: "approved",
      },
    });

    // Create the Account record (this is where better-auth stores the password)
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashPassword(ADMIN_PASSWORD),
      },
    });

    console.log(`\n✅ Admin user created successfully!`);
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n⚠️  IMPORTANT: Change the password after first login!`);
  }

  // Show all pending users that need approval
  const pendingUsers = await prisma.user.findMany({
    where: { approval_status: "pending" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  if (pendingUsers.length > 0) {
    console.log(`\n📋 Pending approval requests (${pendingUsers.length}):`);
    pendingUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} (${u.email}) — signed up ${u.createdAt.toLocaleString()}`);
    });
    console.log(`\n   → Log in as admin and go to /admin to approve these users.`);
  } else {
    console.log(`\n📋 No pending approval requests found.`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
