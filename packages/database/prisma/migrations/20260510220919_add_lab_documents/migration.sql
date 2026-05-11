-- CreateEnum
CREATE TYPE "LabDocumentType" AS ENUM ('LICENSE', 'ACCREDITATION', 'TAX_DOCUMENT', 'OWNERSHIP_DOCUMENT', 'COMPLIANCE_CERTIFICATE', 'OTHER');

-- CreateTable
CREATE TABLE "lab_documents" (
    "id" TEXT NOT NULL,
    "lab_id" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LabDocumentType" NOT NULL DEFAULT 'OTHER',
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lab_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_documents_lab_id_idx" ON "lab_documents"("lab_id");

-- CreateIndex
CREATE INDEX "lab_documents_type_idx" ON "lab_documents"("type");

-- AddForeignKey
ALTER TABLE "lab_documents" ADD CONSTRAINT "lab_documents_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_documents" ADD CONSTRAINT "lab_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
