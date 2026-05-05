import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ exists: false });

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    return NextResponse.json({ exists: false });
  }
}
