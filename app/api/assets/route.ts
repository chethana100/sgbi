import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
    return await auth.api.getSession({ headers: await headers() });
}

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "50");
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";
        const productType = searchParams.get("productType") || "";
        const fwUpdateAvailable = searchParams.get("fwUpdateAvailable") || "";
        const serviceDue = searchParams.get("serviceDue") || "";
        const locationId = searchParams.get("locationId") || "";

        const where: any = { is_deleted: false };

        if (search) {
            where.OR = [
                { product_name: { contains: search, mode: "insensitive" } },
                { serial_number: { contains: search, mode: "insensitive" } },
                { customer: { contains: search, mode: "insensitive" } },
                { current_location_display: { contains: search, mode: "insensitive" } },
            ];
        }
        if (status) where.operational_status = status;
        if (productType) where.product_type = productType;
        if (locationId) {
          // Get all child location IDs recursively
          const getAllChildIds = async (parentId: string): Promise<string[]> => {
            const children = await prisma.location.findMany({
              where: { parent_location_id: parentId, is_active: true }
            });
            const childIds = children.map(c => c.location_id);
            const grandChildIds = await Promise.all(childIds.map(id => getAllChildIds(id)));
            return [parentId, ...childIds, ...grandChildIds.flat()];
          };
          const allLocationIds = await getAllChildIds(locationId);
          where.current_location_id = { in: allLocationIds };
        }

        const [assets, totalCount] = await Promise.all([
            prisma.asset.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { last_modified_at: "desc" },
            }),
            prisma.asset.count({ where }),
        ]);

        const firmwareMasters = await prisma.firmwareMaster.findMany();
        const productImages = await prisma.product.findMany({ select: { product_id: true, image: true } });
        const imageMap = new Map(productImages.map(p => [p.product_id, p.image]));
        const fwMap = new Map(firmwareMasters.map((f) => [f.product_id, f.latest_version]));

        const today = new Date();
        const enriched = assets.map((asset) => {
            const latestFw = fwMap.get(asset.product_id);
            const firmware_update_available = latestFw ? asset.current_firmware !== latestFw : false;
            const daysSinceService = asset.last_service_date
                ? Math.floor((today.getTime() - asset.last_service_date.getTime()) / (1000 * 60 * 60 * 24))
                : null;
            const service_due = daysSinceService !== null
                ? daysSinceService > asset.service_reminder_interval_days
                : false;
            return { ...asset, firmware_update_available, service_due, product_image: imageMap.get(asset.product_id) || null };
        });

        const filtered = enriched.filter((a) => {
            if (fwUpdateAvailable === "true" && !a.firmware_update_available) return false;
            if (serviceDue === "true" && !a.service_due) return false;
            return true;
        });

        return NextResponse.json({
            success: true,
            data: filtered,
            meta: {
                page,
                pageSize,
                totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
            },
        });
    } catch (error) {
        console.error("GET /api/assets error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { product_id, serial_number, pcb_version, current_location_id, customer, current_firmware, operational_status, remarks } = body;

        if (!product_id || !serial_number) {
            return NextResponse.json({ success: false, message: "product_id and serial_number are required" }, { status: 400 });
        }

        const product = await prisma.product.findUnique({ where: { product_id } });
        if (!product) return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });

        const existing = await prisma.asset.findFirst({ where: { product_id, serial_number, is_deleted: false } });
        if (existing) {
            return NextResponse.json(
                { success: false, message: "Serial number already exists for this product — please check and re-enter." },
                { status: 409 }
            );
        }

        let current_location_display = null;
        if (current_location_id) {
            const location = await prisma.location.findUnique({ where: { location_id: current_location_id } });
            current_location_display = location?.full_path || location?.name || null;
        }

        const asset = await prisma.asset.create({
            data: {
                product_id,
                product_name: product.product_name,
                product_type: product.product_type,
                erp_part_number: product.erp_part_number,
                serial_number,
                pcb_version: pcb_version || null,
                current_location_id: current_location_id || null,
                current_location_display,
                customer: customer || null,
                current_firmware: current_firmware || null,
                operational_status: operational_status || "Working",
                remarks: remarks || null,
                enrolled_by: session.user.name,
                last_modified_by: session.user.name,
            },
        });

        await prisma.auditLog.create({
            data: {
                asset_id: asset.asset_id,
                performed_by_user_id: session.user.id,
                action_type: "ASSET_ENROLLED",
                new_value: asset,
                client_app_version: req.headers.get("x-app-version") || "web",
            },
        });

        return NextResponse.json({ success: true, data: asset }, { status: 201 });
    } catch (error) {
        console.error("POST /api/assets error:", error);
        return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
    }
}