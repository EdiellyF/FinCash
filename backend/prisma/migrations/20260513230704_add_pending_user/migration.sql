/*
  Warnings:

  - A unique constraint covering the columns `[user_id,date,provider]` on the table `request_logs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `request_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "request_logs_date_provider_key";

-- AlterTable
ALTER TABLE "request_logs" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PendingUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "otpCode" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingUser_email_key" ON "PendingUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "request_logs_user_id_date_provider_key" ON "request_logs"("user_id", "date", "provider");
