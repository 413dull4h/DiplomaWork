-- CreateTable
CREATE TABLE "teleconsult_sessions" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "hospital_doctor_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL DEFAULT 'CUSTOM_URL',
    "provider_name" TEXT,
    "join_url" TEXT NOT NULL,
    "host_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "created_by_user_id" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teleconsult_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teleconsult_sessions_appointment_id_key" ON "teleconsult_sessions"("appointment_id");

-- CreateIndex
CREATE INDEX "teleconsult_sessions_appointment_id_idx" ON "teleconsult_sessions"("appointment_id");

-- CreateIndex
CREATE INDEX "teleconsult_sessions_patient_id_idx" ON "teleconsult_sessions"("patient_id");

-- CreateIndex
CREATE INDEX "teleconsult_sessions_hospital_id_idx" ON "teleconsult_sessions"("hospital_id");

-- CreateIndex
CREATE INDEX "teleconsult_sessions_doctor_id_idx" ON "teleconsult_sessions"("doctor_id");

-- AddForeignKey
ALTER TABLE "teleconsult_sessions" ADD CONSTRAINT "teleconsult_sessions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teleconsult_sessions" ADD CONSTRAINT "teleconsult_sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teleconsult_sessions" ADD CONSTRAINT "teleconsult_sessions_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teleconsult_sessions" ADD CONSTRAINT "teleconsult_sessions_hospital_doctor_id_fkey" FOREIGN KEY ("hospital_doctor_id") REFERENCES "hospital_doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teleconsult_sessions" ADD CONSTRAINT "teleconsult_sessions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
