-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'field_user');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'revoked');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('main_product', 'accessory');

-- CreateEnum
CREATE TYPE "OperationalStatus" AS ENUM ('Working', 'Repair', 'Scrap');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('ASSET_ENROLLED', 'ASSET_STATUS_CHANGED', 'ASSET_LOCATION_CHANGED', 'ASSET_FIRMWARE_UPDATED', 'ASSET_SERVICE_RESET', 'ASSET_REMARKS_UPDATED', 'ASSET_CHECKED_OUT', 'ASSET_CHECKED_IN', 'ASSET_WARRANTY_UPDATED', 'ASSET_IMAGE_UPLOADED', 'ASSET_IMAGE_DELETED', 'FIRMWARE_MASTER_UPDATED', 'USER_APPROVED', 'USER_ROLE_CHANGED', 'PRODUCT_ADDED', 'LOCATION_ADDED', 'LOCATION_EDITED', 'BACKUP_TRIGGERED');

-- CreateTable
CREATE TABLE "User" (
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'field_user',
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Product" (
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "erp_part_number" TEXT NOT NULL,
    "description" TEXT,
    "serial_prefix" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "asset_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "erp_part_number" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "current_firmware" TEXT,
    "last_firmware_update_date" TIMESTAMP(3),
    "last_firmware_updated_by" TEXT,
    "current_location_id" TEXT,
    "current_location_display" TEXT,
    "customer" TEXT,
    "operational_status" "OperationalStatus" NOT NULL DEFAULT 'Working',
    "last_service_date" TIMESTAMP(3),
    "service_reminder_interval_days" INTEGER NOT NULL DEFAULT 180,
    "checked_out_to_user_id" TEXT,
    "checked_out_at" TIMESTAMP(3),
    "checked_out_purpose" TEXT,
    "warranty_expiry_date" TIMESTAMP(3),
    "warranty_notes" TEXT,
    "image_urls" TEXT[],
    "remarks" TEXT,
    "enrolled_by" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_by" TEXT NOT NULL,
    "last_modified_at" TIMESTAMP(3) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("asset_id")
);

-- CreateTable
CREATE TABLE "FirmwareMaster" (
    "firmware_master_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "latest_version" TEXT NOT NULL,
    "release_notes" TEXT,
    "updated_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirmwareMaster_pkey" PRIMARY KEY ("firmware_master_id")
);

-- CreateTable
CREATE TABLE "Location" (
    "location_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_location_id" TEXT,
    "full_path" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("location_id")
);

-- CreateTable
CREATE TABLE "CheckoutRecord" (
    "checkout_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "checked_out_by_user_id" TEXT NOT NULL,
    "checked_out_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT,
    "checked_in_by_user_id" TEXT,
    "checked_in_at" TIMESTAMP(3),
    "expected_return_date" TIMESTAMP(3),

    CONSTRAINT "CheckoutRecord_pkey" PRIMARY KEY ("checkout_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "log_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "performed_by_user_id" TEXT NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB,
    "notes" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "client_app_version" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_erp_part_number_key" ON "Product"("erp_part_number");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_product_id_serial_number_key" ON "Asset"("product_id", "serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "FirmwareMaster_product_id_key" ON "FirmwareMaster"("product_id");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_current_location_id_fkey" FOREIGN KEY ("current_location_id") REFERENCES "Location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirmwareMaster" ADD CONSTRAINT "FirmwareMaster_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parent_location_id_fkey" FOREIGN KEY ("parent_location_id") REFERENCES "Location"("location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutRecord" ADD CONSTRAINT "CheckoutRecord_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "Asset"("asset_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutRecord" ADD CONSTRAINT "CheckoutRecord_checked_out_by_user_id_fkey" FOREIGN KEY ("checked_out_by_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "Asset"("asset_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
