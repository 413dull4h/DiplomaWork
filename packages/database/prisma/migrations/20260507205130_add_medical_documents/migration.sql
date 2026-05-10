-- CreateEnum
CREATE TYPE "MedicalDocumentType" AS ENUM ('PRESCRIPTION', 'LAB_REPORT', 'IMAGING', 'DISCHARGE_SUMMARY', 'REFERRAL', 'GENERAL_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalDocumentVisibility" AS ENUM ('PATIENT_VISIBLE', 'HOSPITAL_ONLY');

-- CreateTable
CREATE TABLE "medical_documents" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "encounter_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MedicalDocumentType" NOT NULL DEFAULT 'OTHER',
    "visibility" "MedicalDocumentVisibility" NOT NULL DEFAULT 'PATIENT_VISIBLE',
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_documents_patient_id_idx" ON "medical_documents"("patient_id");

-- CreateIndex
CREATE INDEX "medical_documents_hospital_id_idx" ON "medical_documents"("hospital_id");

-- CreateIndex
CREATE INDEX "medical_documents_appointment_id_idx" ON "medical_documents"("appointment_id");

-- CreateIndex
CREATE INDEX "medical_documents_encounter_id_idx" ON "medical_documents"("encounter_id");

-- CreateIndex
CREATE INDEX "medical_documents_type_idx" ON "medical_documents"("type");

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "encounters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
