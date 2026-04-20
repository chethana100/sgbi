import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  const cochin = await prisma.location.upsert({
    where: { location_id: "loc-cochin-001" },
    update: {},
    create: { location_id: "loc-cochin-001", name: "Cochin", parent_location_id: null, full_path: "Cochin", is_active: true, created_by: "System" },
  });

  const us = await prisma.location.upsert({
    where: { location_id: "loc-us-001" },
    update: {},
    create: { location_id: "loc-us-001", name: "US", parent_location_id: null, full_path: "US", is_active: true, created_by: "System" },
  });

  const uk = await prisma.location.upsert({
    where: { location_id: "loc-uk-001" },
    update: {},
    create: { location_id: "loc-uk-001", name: "UK", parent_location_id: null, full_path: "UK", is_active: true, created_by: "System" },
  });

  console.log("Locations seeded: Cochin, US, UK");

  const products = [
    { product_id: "prod-qtap-001", product_name: "QTap", product_type: "accessory" as const, erp_part_number: "QTAP-001", description: "QTap accessory unit", serial_prefix: "qtap" },
    { product_id: "prod-qswipe-001", product_name: "QSwipe", product_type: "accessory" as const, erp_part_number: "QSWIPE-001", description: "QSwipe accessory unit", serial_prefix: "qswipe" },
    { product_id: "prod-qmuxbq-001", product_name: "QMux-BQ", product_type: "accessory" as const, erp_part_number: "QMUXBQ-001", description: "QMux BQ accessory unit", serial_prefix: "qmuxbq" },
    { product_id: "prod-qba-001", product_name: "QBA", product_type: "accessory" as const, erp_part_number: "QBA-001", description: "QBA accessory unit", serial_prefix: "qbact" },
    { product_id: "prod-qmuxc-001", product_name: "QMux-C", product_type: "accessory" as const, erp_part_number: "QMUXC-001", description: "QMux C accessory unit", serial_prefix: "qmuxsc" },
    { product_id: "prod-qmuxnc-001", product_name: "QMux-NC", product_type: "accessory" as const, erp_part_number: "QMUXNC-001", description: "QMux NC accessory unit", serial_prefix: "qmuxnc" },
    { product_id: "prod-qmuxsd-001", product_name: "QMux-SD", product_type: "accessory" as const, erp_part_number: "QMUXSD-001", description: "QMux SD accessory unit", serial_prefix: "qmuxsd" },
    { product_id: "prod-kbdemu-001", product_name: "Keyboard Emulator", product_type: "accessory" as const, erp_part_number: "KBDEMU-001", description: "Keyboard Emulator unit", serial_prefix: "kbdemu" },
    { product_id: "prod-accpdu-001", product_name: "ACC PDU", product_type: "accessory" as const, erp_part_number: "ACCPDU-001", description: "ACC PDU accessory unit", serial_prefix: "accpdu" },
    { product_id: "prod-qroll-001", product_name: "QRoll", product_type: "accessory" as const, erp_part_number: "QROLL-001", description: "QRoll accessory unit", serial_prefix: "qroll" },
    { product_id: "prod-qtrigr-001", product_name: "Handheld Scanner Trigger", product_type: "accessory" as const, erp_part_number: "QTRIGR-001", description: "Handheld scanner trigger", serial_prefix: "qtrigr" },
    { product_id: "prod-qswipev-001", product_name: "QSwipe-V", product_type: "accessory" as const, erp_part_number: "QSWIPEV-001", description: "QSwipe Vertical unit", serial_prefix: "qswipev" },
    { product_id: "prod-qtapv-001", product_name: "Vertical Card Insert", product_type: "accessory" as const, erp_part_number: "QTAPV-001", description: "Vertical card insert unit", serial_prefix: "qtapv" },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { product_id: product.product_id },
      update: {},
      create: { ...product, is_active: true },
    });
  }

  console.log("Products seeded: 13 products");

  const firmwareVersions = [
    { product_id: "prod-qtap-001", latest_version: "V3.0" },
    { product_id: "prod-qswipe-001", latest_version: "3.0.0" },
    { product_id: "prod-qmuxbq-001", latest_version: "1.2" },
    { product_id: "prod-qba-001", latest_version: "1.0.0" },
    { product_id: "prod-qmuxc-001", latest_version: "1.2.0" },
    { product_id: "prod-qmuxnc-001", latest_version: "2.6.1" },
    { product_id: "prod-qmuxsd-001", latest_version: "1.0.0" },
    { product_id: "prod-kbdemu-001", latest_version: "1.0.0" },
    { product_id: "prod-accpdu-001", latest_version: "1.0.0" },
    { product_id: "prod-qroll-001", latest_version: "1.0.0" },
    { product_id: "prod-qtrigr-001", latest_version: "2.0.0" },
    { product_id: "prod-qswipev-001", latest_version: "V2.3" },
    { product_id: "prod-qtapv-001", latest_version: "V1.0" },
  ];

  for (const fw of firmwareVersions) {
    await prisma.firmwareMaster.upsert({
      where: { product_id: fw.product_id },
      update: { latest_version: fw.latest_version },
      create: { product_id: fw.product_id, latest_version: fw.latest_version, updated_by: "System Seed", release_notes: "Initial version" },
    });
  }

  console.log("Firmware master seeded");

  const locationMap: Record<string, string> = {
    "SGBI COK": "loc-cochin-001",
    "SGBI US": "loc-us-001",
    "SGBI uS": "loc-us-001",
    "SGBI US West": "loc-us-001",
    "SGBI UST": "loc-us-001",
    "SGBI US demo unit west": "loc-us-001",
    "SGBI UK": "loc-uk-001",
    "SGBI UK Demo Centre": "loc-uk-001",
    "kingfisher - UK": "loc-uk-001",
    "BOOTS- UK": "loc-uk-001",
  };

  const locationDisplayMap: Record<string, string> = {
    "loc-cochin-001": "Cochin",
    "loc-us-001": "US",
    "loc-uk-001": "UK",
  };

  const allAssets: any[] = [
    { serial: "qtap0", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Concerto", firmware: "V3.0", remarks: "QTAP for MUX" },
    { serial: "qtap1", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Concerto", firmware: "V3.0", remarks: null },
    { serial: "qtap2", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qtap3", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "QTAP for MUX Demo" },
    { serial: "qtap4", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "Demo" },
    { serial: "qtap5", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "QTAP for MUX" },
    { serial: "qtap6", product_id: "prod-qtap-001", location: "SGBI uS", customer: "Internal", firmware: null, remarks: "PCB for US" },
    { serial: "qtap7", product_id: "prod-qtap-001", location: "SGBI uS", customer: "Internal", firmware: null, remarks: "PCB for US" },
    { serial: "qtap8", product_id: "prod-qtap-001", location: "SGBI UK", customer: "Internal", firmware: null, remarks: "SGBI UK" },
    { serial: "qtap9", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "QTAP for MUX" },
    { serial: "qtap10", product_id: "prod-qtap-001", location: "SGBI US West", customer: "Internal", firmware: null, remarks: "Qtap for mux" },
    { serial: "qtap11", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qtap12", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qtap20", product_id: "prod-qtap-001", location: "SGBI COK", customer: "Internal", firmware: "V3.0", pcb: "V1.2.0", remarks: "QTAP for MUX" },
    { serial: "qswipe0", product_id: "prod-qswipe-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "Development Unit" },
    { serial: "qswipe1", product_id: "prod-qswipe-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "FQC Completed" },
    { serial: "qswipe2", product_id: "prod-qswipe-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "FQC Completed" },
    { serial: "qswipe3", product_id: "prod-qswipe-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: "PCBoard shipping to the US" },
    { serial: "qswipe4", product_id: "prod-qswipe-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qswipe8", product_id: "prod-qswipe-001", location: "SGBI COK", customer: "Internal", firmware: "3.0.0", pcb: "1.2.0", remarks: "Q1-25 B2" },
    { serial: "qswipe9", product_id: "prod-qswipe-001", location: "SGBI COK", customer: "Internal", firmware: "3.0.0", pcb: "1.2.0", remarks: "Q1-25 B2" },
    { serial: "qswipe11", product_id: "prod-qswipe-001", location: "SGBI COK", customer: "Internal", firmware: "1.0.0", pcb: "vertical 1.0.0", remarks: null },
    { serial: "qmuxbq0", product_id: "prod-qmuxbq-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "Development Unit" },
    { serial: "qmuxbq1", product_id: "prod-qmuxbq-001", location: "SGBI COK", customer: "Concerto", firmware: null, remarks: null },
    { serial: "qmuxbq2", product_id: "prod-qmuxbq-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "In Demo Unit" },
    { serial: "qmuxbq5", product_id: "prod-qmuxbq-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: "Reworked unit for US" },
    { serial: "qmuxbq15", product_id: "prod-qmuxbq-001", location: "SGBI COK", customer: "Internal", firmware: "1.1", pcb: "V1.1.0", remarks: null },
    { serial: "qmuxbq999", product_id: "prod-qmuxbq-001", location: "SGBI COK", customer: "Internal", firmware: "1.0", pcb: "V1.1.0", remarks: "Qmux BQ TFT" },
    { serial: "qmuxbq17", product_id: "prod-qmuxbq-001", location: "SGBI COK", customer: "HEB", firmware: "1.2", pcb: "V1.1.0", remarks: "For HEB" },
    { serial: "qbact0", product_id: "prod-qba-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: null },
    { serial: "qbact1", product_id: "prod-qba-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: null },
    { serial: "qbact2", product_id: "prod-qba-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: null },
    { serial: "qbact3", product_id: "prod-qba-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: null },
    { serial: "qbact5", product_id: "prod-qba-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qbact16", product_id: "prod-qba-001", location: "SGBI UK", customer: "Internal", firmware: null, remarks: "Nothing 2a" },
    { serial: "qbact17", product_id: "prod-qba-001", location: "SGBI UK", customer: "Internal", firmware: null, remarks: "iPhone 14 Pro Max" },
    { serial: "qmuxsc0", product_id: "prod-qmuxc-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qmuxsc1", product_id: "prod-qmuxc-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qmuxsc2", product_id: "prod-qmuxc-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: null },
    { serial: "qmuxsc5", product_id: "prod-qmuxc-001", location: "SGBI COK", customer: "Internal", firmware: "1.2.0", pcb: "1.2", remarks: null },
    { serial: "qmuxsc6", product_id: "prod-qmuxc-001", location: "SGBI COK", customer: "Internal", firmware: "1.2.0", pcb: "1.2", remarks: null },
    { serial: "qmuxnc0", product_id: "prod-qmuxnc-001", location: "kingfisher - UK", customer: "Kingfisher", firmware: "2.6.1", pcb: "1.3.0", remarks: null },
    { serial: "qmuxnc1", product_id: "prod-qmuxnc-001", location: "BOOTS- UK", customer: "BOOTS", firmware: "2.6.1", pcb: "1.3.0", remarks: "Shipped to boots" },
    { serial: "qmuxnc2", product_id: "prod-qmuxnc-001", location: "kingfisher - UK", customer: "Kingfisher", firmware: "2.6.1", pcb: "1.3.0", remarks: null },
    { serial: "qmuxnc3", product_id: "prod-qmuxnc-001", location: "SGBI US", customer: "HEB", firmware: "2.6.1", pcb: "1.3.0", remarks: null },
    { serial: "qmuxnc4", product_id: "prod-qmuxnc-001", location: "SGBI US", customer: "HEB", firmware: "2.6.1", pcb: "1.3.0", remarks: null },
    { serial: "qmuxsd0", product_id: "prod-qmuxsd-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "kbdemu0", product_id: "prod-kbdemu-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "In Demo unit" },
    { serial: "kbdemu1", product_id: "prod-kbdemu-001", location: "SGBI COK", customer: "NRF", firmware: null, remarks: "NRF" },
    { serial: "kbdemu2", product_id: "prod-kbdemu-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "kbdemu3", product_id: "prod-kbdemu-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "kbdemu4", product_id: "prod-kbdemu-001", location: "SGBI UST", customer: "Internal", firmware: null, remarks: null },
    { serial: "kbdemu11", product_id: "prod-kbdemu-001", location: "SGBI COK", customer: "HEB", firmware: null, pcb: "V1.0.0", remarks: "For HEB" },
    { serial: "kbdemu12", product_id: "prod-kbdemu-001", location: "SGBI COK", customer: "HEB", firmware: null, pcb: "V1.0.0", remarks: "For HEB" },
    { serial: "accpdu0", product_id: "prod-accpdu-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: null },
    { serial: "accpdu1", product_id: "prod-accpdu-001", location: "SGBI US", customer: "Internal", firmware: null, remarks: null },
    { serial: "accpdu3", product_id: "prod-accpdu-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "In Demo" },
    { serial: "accpdu4", product_id: "prod-accpdu-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "Accessory testing area" },
    { serial: "qroll0", product_id: "prod-qroll-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: "Demo" },
    { serial: "qroll1", product_id: "prod-qroll-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qroll3", product_id: "prod-qroll-001", location: "SGBI COK", customer: "Internal", firmware: null, remarks: null },
    { serial: "qtrigr0", product_id: "prod-qtrigr-001", location: "SGBI COK", customer: "Internal", firmware: "2.0.0", pcb: "V1.1.0", remarks: null },
    { serial: "qtrigr1", product_id: "prod-qtrigr-001", location: "SGBI UK", customer: "BOOTS", firmware: "2.0.0", pcb: "V1.1.0", remarks: "Shipped to BOOTS" },
    { serial: "qtrigr2", product_id: "prod-qtrigr-001", location: "SGBI COK", customer: "HEB", firmware: "V2.3", pcb: "V1.1.0", remarks: "For HEB" },
    { serial: "qtrigr3", product_id: "prod-qtrigr-001", location: "SGBI COK", customer: "HEB", firmware: "V2.3", pcb: "V1.1.0", remarks: "For HEB" },
    { serial: "qswipev0", product_id: "prod-qswipev-001", location: "SGBI COK", customer: "Internal", firmware: "1.0.0", pcb: "V1.0.0", remarks: null },
    { serial: "qswipev1", product_id: "prod-qswipev-001", location: "SGBI COK", customer: "HEB", firmware: "V2.3", pcb: "Vertical V1.2.0", remarks: "For HEB" },
    { serial: "qswipev2", product_id: "prod-qswipev-001", location: "SGBI COK", customer: "HEB", firmware: "V2.3", pcb: "Vertical V1.2.0", remarks: "For HEB" },
    { serial: "qswipev3", product_id: "prod-qswipev-001", location: "SGBI COK", customer: "BOOTS", firmware: "V2.3", pcb: "Vertical V1.0.0", remarks: "For BOOTS" },
    { serial: "qswipev4", product_id: "prod-qswipev-001", location: "SGBI COK", customer: "BOOTS", firmware: "V2.3", pcb: "Vertical V1.0.0", remarks: "Shipped to BOOTS" },
    { serial: "qtapv0", product_id: "prod-qtapv-001", location: "SGBI COK", customer: "HEB", firmware: "V1.0", pcb: "Vertical V1.2.0", remarks: "For HEB" },
    { serial: "qtapv1", product_id: "prod-qtapv-001", location: "SGBI COK", customer: "HEB", firmware: "V1.0", pcb: "Vertical V1.2.0", remarks: "For HEB" },
  ];

  let assetCount = 0;
  for (const a of allAssets) {
    const locationId = locationMap[a.location] || null;
    const locationDisplay = locationId ? locationDisplayMap[locationId] : a.location;
    const product = await prisma.product.findUnique({ where: { product_id: a.product_id } });
    if (!product) continue;
    const existing = await prisma.asset.findFirst({
      where: { product_id: a.product_id, serial_number: a.serial, is_deleted: false },
    });
    if (!existing) {
      await prisma.asset.create({
        data: {
          product_id: a.product_id,
          product_name: product.product_name,
          product_type: product.product_type,
          erp_part_number: product.erp_part_number,
          serial_number: a.serial,
          pcb_version: a.pcb || null,
          current_firmware: a.firmware || null,
          current_location_id: locationId,
          current_location_display: locationDisplay,
          customer: a.customer || "Internal",
          operational_status: "Working",
          remarks: a.remarks || null,
          enrolled_by: "System Seed",
          last_modified_by: "System Seed",
        },
      });
      assetCount++;
    }
  }

  console.log("Assets seeded: " + assetCount + " new assets");
  console.log("Seed completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
