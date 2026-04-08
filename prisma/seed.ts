import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SRD Initial Data...');

  // 1. Initial Products
  const quacoVertix = await prisma.product.upsert({
    where: { erp_part_number: 'QV-1000' },
    update: {},
    create: {
      product_name: 'Quaco Vertix',
      product_type: 'main_product',
      erp_part_number: 'QV-1000',
      description: 'SGBI Quaco Vertix Main Hardware Unit',
      serial_prefix: 'QV',
      is_active: true,
    },
  });

  const quacoVertixPlus = await prisma.product.upsert({
    where: { erp_part_number: 'QVP-2000' },
    update: {},
    create: {
      product_name: 'Quaco Vertix Plus',
      product_type: 'main_product',
      erp_part_number: 'QVP-2000',
      description: 'SGBI Quaco Vertix Plus with enhanced HMI testing',
      serial_prefix: 'QVP',
      is_active: true,
    },
  });

  console.log('✓ Products Seeded');

  // 2. Firmware Masters
  await prisma.firmwareMaster.upsert({
    where: { product_id: quacoVertix.product_id },
    update: {},
    create: {
      product_id: quacoVertix.product_id,
      latest_version: 'v1.0.0',
      release_notes: 'Initial production release for Quaco Vertix',
      updated_by: 'System Seed',
    },
  });

  await prisma.firmwareMaster.upsert({
    where: { product_id: quacoVertixPlus.product_id },
    update: {},
    create: {
      product_id: quacoVertixPlus.product_id,
      latest_version: 'v2.1.0',
      release_notes: 'Initial production release for Quaco Vertix Plus',
      updated_by: 'System Seed',
    },
  });

  console.log('✓ Firmware Masters Seeded');

  // 3. Location Tree
  await prisma.location.deleteMany({});
  
  const indiaLocation = await prisma.location.create({
    data: {
      name: 'India',
      created_by: 'System Seed',
      full_path: 'India',
    },
  });

  const cochinLocation = await prisma.location.create({
    data: {
      name: 'Cochin',
      parent_location_id: indiaLocation.location_id,
      created_by: 'System Seed',
      full_path: 'India › Cochin',
    },
  });

  const demoLocation = await prisma.location.create({
    data: {
      name: 'Demo-A1',
      parent_location_id: cochinLocation.location_id,
      created_by: 'System Seed',
      full_path: 'India › Cochin › Demo-A1',
    },
  });

  console.log('✓ Location Tree Seeded');

  // 4. Dummy Assets for Dashboard
  console.log('Seeding Dummy Assets...');
  
  await prisma.asset.deleteMany({});
  
  await prisma.asset.create({
    data: {
      product_id: quacoVertix.product_id,
      product_name: quacoVertix.product_name,
      product_type: quacoVertix.product_type,
      erp_part_number: quacoVertix.erp_part_number,
      serial_number: 'QV001',
      current_firmware: 'v0.9.0', // Needs update
      current_location_id: demoLocation.location_id,
      current_location_display: demoLocation.full_path,
      customer: 'Internal R&D',
      operational_status: 'Working',
      last_service_date: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000), // 200 days ago (Service Due!)
      enrolled_by: 'System Seed',
      last_modified_by: 'System Seed'
    }
  });

  await prisma.asset.create({
    data: {
      product_id: quacoVertixPlus.product_id,
      product_name: quacoVertixPlus.product_name,
      product_type: quacoVertixPlus.product_type,
      erp_part_number: quacoVertixPlus.erp_part_number,
      serial_number: 'QVP001',
      current_firmware: 'v2.1.0', // Up to date
      current_location_id: demoLocation.location_id,
      current_location_display: demoLocation.full_path,
      customer: 'Client Beta Site',
      operational_status: 'Repair',
      last_service_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      enrolled_by: 'System Seed',
      last_modified_by: 'System Seed'
    }
  });

  console.log('✓ Dummy Assets Seeded');
  console.log('SGBI Week 1 Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
