import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const assets = await prisma.asset.findMany({
      where: { is_deleted: false },
      orderBy: { enrolled_at: "desc" },
    });

    const csvHeaders = [
      "Serial Number", "Product Name", "Product Type", "ERP Part Number",
      "Operational Status", "Current Firmware", "Current Location",
      "Customer", "Last Service Date", "Enrolled By", "Enrolled At", "Remarks",
    ];

    const rows = assets.map((a) => [
      a.serial_number, a.product_name, a.product_type, a.erp_part_number,
      a.operational_status, a.current_firmware || "",
      a.current_location_display || "", a.customer || "",
      a.last_service_date ? new Date(a.last_service_date).toLocaleDateString() : "",
      a.enrolled_by, new Date(a.enrolled_at).toLocaleDateString(), a.remarks || "",
    ]);

    const csv = [
      csvHeaders.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="sgbi-assets-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export assets error:", error);
    return NextResponse.json({ success: false, message: "Export failed" }, { status: 500 });
  }
}
