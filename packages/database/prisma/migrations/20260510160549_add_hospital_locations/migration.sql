-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "location_id" TEXT;

-- AlterTable
ALTER TABLE "hospital_departments" ADD COLUMN     "location_id" TEXT;

-- AlterTable
ALTER TABLE "hospital_doctors" ADD COLUMN     "location_id" TEXT;

-- CreateTable
CREATE TABLE "hospital_locations" (
    "id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "address_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hospital_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hospital_locations_hospital_id_idx" ON "hospital_locations"("hospital_id");

-- CreateIndex
CREATE INDEX "hospital_locations_address_id_idx" ON "hospital_locations"("address_id");

-- CreateIndex
CREATE INDEX "appointments_location_id_idx" ON "appointments"("location_id");

-- CreateIndex
CREATE INDEX "hospital_departments_location_id_idx" ON "hospital_departments"("location_id");

-- CreateIndex
CREATE INDEX "hospital_doctors_location_id_idx" ON "hospital_doctors"("location_id");

-- AddForeignKey
ALTER TABLE "hospital_departments" ADD CONSTRAINT "hospital_departments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "hospital_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_doctors" ADD CONSTRAINT "hospital_doctors_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "hospital_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "hospital_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_locations" ADD CONSTRAINT "hospital_locations_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_locations" ADD CONSTRAINT "hospital_locations_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
