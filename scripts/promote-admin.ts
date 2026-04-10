/**
 * Promote an existing user to admin.
 * 
 * Usage:
 *   npx tsx scripts/promote-admin.ts admin@sgbi.us
 * 
 * This script does NOT touch the password — it only changes role and approval.
 * Sign up first via the normal signup form, then run this script.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Usage: npx tsx scripts/promote-admin.ts <email>");
    console.error("   e.g.: npx tsx scripts/promote-admin.ts admin@sgbi.us");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`❌ No user found with email: ${email}`);
    console.error("   → Sign up first via the /auth/signup page, then run this script.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: {
      role: "admin",
      approval_status: "approved",
      emailVerified: true,
    },
  });

  console.log(`\n✅ Successfully promoted ${user.name} (${email}) to admin!`);
  console.log(`   Role: admin`);
  console.log(`   Status: approved`);
  console.log(`\n→ You can now log in at /auth/login with this email and your chosen password.`);

  // Show all other pending users
  const pending = await prisma.user.findMany({
    where: { approval_status: "pending", email: { not: email } },
    select: { name: true, email: true, createdAt: true },
  });

  if (pending.length > 0) {
    console.log(`\n📋 Other pending users waiting for approval:`);
    pending.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} (${u.email})`);
    });
    console.log(`\n   → Log in as admin → go to /admin → approve them.`);
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
