-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "hospital_reviews" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "overall_rating" INTEGER NOT NULL,
    "staff_rating" INTEGER,
    "cleanliness_rating" INTEGER,
    "waiting_time_rating" INTEGER,
    "service_rating" INTEGER,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "moderation_note" TEXT,
    "moderated_by_user_id" TEXT,
    "moderated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hospital_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_reviews" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "hospital_doctor_id" TEXT NOT NULL,
    "overall_rating" INTEGER NOT NULL,
    "communication_rating" INTEGER,
    "professionalism_rating" INTEGER,
    "helpfulness_rating" INTEGER,
    "would_recommend" BOOLEAN,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "moderation_note" TEXT,
    "moderated_by_user_id" TEXT,
    "moderated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "doctor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_visit_feedback" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "hospital_doctor_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "arrived_on_time" BOOLEAN,
    "was_no_show" BOOLEAN,
    "followed_instructions" BOOLEAN,
    "follow_up_needed" BOOLEAN,
    "communication_note" TEXT,
    "internal_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patient_visit_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospital_reviews_appointment_id_key" ON "hospital_reviews"("appointment_id");

-- CreateIndex
CREATE INDEX "hospital_reviews_patient_id_idx" ON "hospital_reviews"("patient_id");

-- CreateIndex
CREATE INDEX "hospital_reviews_hospital_id_idx" ON "hospital_reviews"("hospital_id");

-- CreateIndex
CREATE INDEX "hospital_reviews_status_idx" ON "hospital_reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_reviews_appointment_id_key" ON "doctor_reviews"("appointment_id");

-- CreateIndex
CREATE INDEX "doctor_reviews_patient_id_idx" ON "doctor_reviews"("patient_id");

-- CreateIndex
CREATE INDEX "doctor_reviews_hospital_id_idx" ON "doctor_reviews"("hospital_id");

-- CreateIndex
CREATE INDEX "doctor_reviews_doctor_id_idx" ON "doctor_reviews"("doctor_id");

-- CreateIndex
CREATE INDEX "doctor_reviews_hospital_doctor_id_idx" ON "doctor_reviews"("hospital_doctor_id");

-- CreateIndex
CREATE INDEX "doctor_reviews_status_idx" ON "doctor_reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "patient_visit_feedback_appointment_id_key" ON "patient_visit_feedback"("appointment_id");

-- CreateIndex
CREATE INDEX "patient_visit_feedback_patient_id_idx" ON "patient_visit_feedback"("patient_id");

-- CreateIndex
CREATE INDEX "patient_visit_feedback_hospital_id_idx" ON "patient_visit_feedback"("hospital_id");

-- CreateIndex
CREATE INDEX "patient_visit_feedback_doctor_id_idx" ON "patient_visit_feedback"("doctor_id");

-- CreateIndex
CREATE INDEX "patient_visit_feedback_created_by_user_id_idx" ON "patient_visit_feedback"("created_by_user_id");

-- AddForeignKey
ALTER TABLE "hospital_reviews" ADD CONSTRAINT "hospital_reviews_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_reviews" ADD CONSTRAINT "hospital_reviews_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_reviews" ADD CONSTRAINT "hospital_reviews_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_reviews" ADD CONSTRAINT "doctor_reviews_hospital_doctor_id_fkey" FOREIGN KEY ("hospital_doctor_id") REFERENCES "hospital_doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visit_feedback" ADD CONSTRAINT "patient_visit_feedback_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visit_feedback" ADD CONSTRAINT "patient_visit_feedback_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visit_feedback" ADD CONSTRAINT "patient_visit_feedback_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visit_feedback" ADD CONSTRAINT "patient_visit_feedback_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visit_feedback" ADD CONSTRAINT "patient_visit_feedback_hospital_doctor_id_fkey" FOREIGN KEY ("hospital_doctor_id") REFERENCES "hospital_doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_visit_feedback" ADD CONSTRAINT "patient_visit_feedback_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
