-- CreateEnum
CREATE TYPE "ChatThreadType" AS ENUM ('APPOINTMENT', 'PATIENT_HOSPITAL', 'PATIENT_DOCTOR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ChatMessageSenderRole" AS ENUM ('PATIENT', 'DOCTOR', 'HOSPITAL_STAFF', 'PLATFORM_ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('SENT', 'READ', 'DELETED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_MESSAGE';

-- CreateTable
CREATE TABLE "chat_threads" (
    "id" TEXT NOT NULL,
    "type" "ChatThreadType" NOT NULL DEFAULT 'APPOINTMENT',
    "appointment_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "hospital_doctor_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "subject" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "chat_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "sender_role" "ChatMessageSenderRole" NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ChatMessageStatus" NOT NULL DEFAULT 'SENT',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_threads_appointment_id_key" ON "chat_threads"("appointment_id");

-- CreateIndex
CREATE INDEX "chat_threads_patient_id_idx" ON "chat_threads"("patient_id");

-- CreateIndex
CREATE INDEX "chat_threads_hospital_id_idx" ON "chat_threads"("hospital_id");

-- CreateIndex
CREATE INDEX "chat_threads_doctor_id_idx" ON "chat_threads"("doctor_id");

-- CreateIndex
CREATE INDEX "chat_threads_hospital_doctor_id_idx" ON "chat_threads"("hospital_doctor_id");

-- CreateIndex
CREATE INDEX "chat_threads_appointment_id_idx" ON "chat_threads"("appointment_id");

-- CreateIndex
CREATE INDEX "chat_threads_last_message_at_idx" ON "chat_threads"("last_message_at");

-- CreateIndex
CREATE INDEX "chat_messages_thread_id_idx" ON "chat_messages"("thread_id");

-- CreateIndex
CREATE INDEX "chat_messages_sender_user_id_idx" ON "chat_messages"("sender_user_id");

-- CreateIndex
CREATE INDEX "chat_messages_thread_id_created_at_idx" ON "chat_messages"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_messages_status_idx" ON "chat_messages"("status");

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_hospital_doctor_id_fkey" FOREIGN KEY ("hospital_doctor_id") REFERENCES "hospital_doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
