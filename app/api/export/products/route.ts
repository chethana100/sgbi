import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const products = await prisma.product.findMany({
      where: { is_active: true },
      orderBy: { created_at: "desc" },
    });

    const csvHeaders = [
      "Product Name", "Product Type", "ERP Part Number",
      "Serial Prefix", "Description", "Active", "Created At",
    ];

    const rows = products.map((p) => [
      p.product_name, p.product_type, p.erp_part_number,
      p.serial_prefix || "", p.description || "",
      p.is_active ? "Yes" : "No",
      new Date(p.created_at).toLocaleDateString(),
    ]);

    const csv = [
      csvHeaders.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sgbi-products-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export products error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
