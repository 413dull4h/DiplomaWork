-- CreateEnum
CREATE TYPE "LabStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LabType" AS ENUM ('INTERNAL', 'INDEPENDENT', 'PARTNER');

-- CreateEnum
CREATE TYPE "LabStaffRole" AS ENUM ('LAB_ADMIN', 'LAB_TECHNICIAN', 'SAMPLE_COLLECTOR', 'REPORT_MANAGER');

-- CreateEnum
CREATE TYPE "LabTestCategory" AS ENUM ('PATHOLOGY', 'RADIOLOGY', 'CARDIOLOGY', 'MICROBIOLOGY', 'BIOCHEMISTRY', 'HEMATOLOGY', 'IMMUNOLOGY', 'GENERAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SampleType" AS ENUM ('BLOOD', 'URINE', 'STOOL', 'SWAB', 'SPUTUM', 'TISSUE', 'IMAGING', 'ECG', 'OTHER');

-- CreateEnum
CREATE TYPE "LabOrderSource" AS ENUM ('DOCTOR', 'HOSPITAL', 'PATIENT_DIRECT');

-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'REJECTED', 'SCHEDULED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SampleCollectionType" AS ENUM ('IN_CENTER', 'HOME_COLLECTION');

-- CreateEnum
CREATE TYPE "LabReportStatus" AS ENUM ('DRAFT', 'FINAL', 'CORRECTED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleName" ADD VALUE 'LAB_ADMIN';
ALTER TYPE "RoleName" ADD VALUE 'LAB_STAFF';
ALTER TYPE "RoleName" ADD VALUE 'LAB_TECHNICIAN';

-- AlterTable
ALTER TABLE "hospital_doctors" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "labs" (
    "id" TEXT NOT NULL,
    "hospital_id" TEXT,
    "address_id" TEXT,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "type" "LabType" NOT NULL DEFAULT 'INDEPENDENT',
    "status" "LabStatus" NOT NULL DEFAULT 'PENDING',
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "license_number" TEXT,
    "accreditation" TEXT,
    "working_hours" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_staff" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lab_id" TEXT NOT NULL,
    "staff_role" "LabStaffRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lab_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_tests" (
    "id" TEXT NOT NULL,
    "lab_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "LabTestCategory" NOT NULL DEFAULT 'GENERAL',
    "sampleType" "SampleType" NOT NULL DEFAULT 'BLOOD',
    "price" DECIMAL(10,2),
    "turnaround_time_hours" INTEGER,
    "patient_instructions" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" TEXT NOT NULL,
    "lab_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "hospital_id" TEXT,
    "doctor_id" TEXT,
    "hospital_doctor_id" TEXT,
    "appointment_id" TEXT,
    "encounter_id" TEXT,
    "source" "LabOrderSource" NOT NULL DEFAULT 'HOSPITAL',
    "status" "LabOrderStatus" NOT NULL DEFAULT 'REQUESTED',
    "collection_type" "SampleCollectionType" NOT NULL DEFAULT 'IN_CENTER',
    "requested_by_user_id" TEXT,
    "accepted_by_user_id" TEXT,
    "rejected_by_user_id" TEXT,
    "reason" TEXT,
    "clinical_notes" TEXT,
    "rejection_reason" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sample_collected_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_order_items" (
    "id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "lab_test_id" TEXT NOT NULL,
    "test_name" TEXT NOT NULL,
    "test_code" TEXT,
    "price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" TEXT NOT NULL,
    "lab_order_id" TEXT NOT NULL,
    "lab_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "hospital_id" TEXT,
    "doctor_id" TEXT,
    "appointment_id" TEXT,
    "encounter_id" TEXT,
    "uploaded_by_user_id" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" "LabReportStatus" NOT NULL DEFAULT 'FINAL',
    "file_name" TEXT,
    "original_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "file_url" TEXT,
    "result_data" JSONB,
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "labs_hospital_id_idx" ON "labs"("hospital_id");

-- CreateIndex
CREATE INDEX "labs_status_idx" ON "labs"("status");

-- CreateIndex
CREATE INDEX "labs_type_idx" ON "labs"("type");

-- CreateIndex
CREATE INDEX "lab_staff_lab_id_idx" ON "lab_staff"("lab_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_staff_user_id_lab_id_key" ON "lab_staff"("user_id", "lab_id");

-- CreateIndex
CREATE INDEX "lab_tests_lab_id_idx" ON "lab_tests"("lab_id");

-- CreateIndex
CREATE INDEX "lab_tests_category_idx" ON "lab_tests"("category");

-- CreateIndex
CREATE UNIQUE INDEX "lab_tests_lab_id_code_key" ON "lab_tests"("lab_id", "code");

-- CreateIndex
CREATE INDEX "lab_orders_lab_id_idx" ON "lab_orders"("lab_id");

-- CreateIndex
CREATE INDEX "lab_orders_patient_id_idx" ON "lab_orders"("patient_id");

-- CreateIndex
CREATE INDEX "lab_orders_hospital_id_idx" ON "lab_orders"("hospital_id");

-- CreateIndex
CREATE INDEX "lab_orders_doctor_id_idx" ON "lab_orders"("doctor_id");

-- CreateIndex
CREATE INDEX "lab_orders_appointment_id_idx" ON "lab_orders"("appointment_id");

-- CreateIndex
CREATE INDEX "lab_orders_status_idx" ON "lab_orders"("status");

-- CreateIndex
CREATE INDEX "lab_order_items_lab_order_id_idx" ON "lab_order_items"("lab_order_id");

-- CreateIndex
CREATE INDEX "lab_order_items_lab_test_id_idx" ON "lab_order_items"("lab_test_id");

-- CreateIndex
CREATE INDEX "lab_reports_lab_order_id_idx" ON "lab_reports"("lab_order_id");

-- CreateIndex
CREATE INDEX "lab_reports_lab_id_idx" ON "lab_reports"("lab_id");

-- CreateIndex
CREATE INDEX "lab_reports_patient_id_idx" ON "lab_reports"("patient_id");

-- CreateIndex
CREATE INDEX "lab_reports_hospital_id_idx" ON "lab_reports"("hospital_id");

-- CreateIndex
CREATE INDEX "lab_reports_doctor_id_idx" ON "lab_reports"("doctor_id");

-- CreateIndex
CREATE INDEX "lab_reports_status_idx" ON "lab_reports"("status");

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_staff" ADD CONSTRAINT "lab_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_staff" ADD CONSTRAINT "lab_staff_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_hospital_doctor_id_fkey" FOREIGN KEY ("hospital_doctor_id") REFERENCES "hospital_doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_accepted_by_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_rejected_by_user_id_fkey" FOREIGN KEY ("rejected_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_order_items" ADD CONSTRAINT "lab_order_items_lab_test_id_fkey" FOREIGN KEY ("lab_test_id") REFERENCES "lab_tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
