-- AlterTable
ALTER TABLE "users" ADD COLUMN     "backup_codes" JSONB,
ADD COLUMN     "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totp_secret" TEXT;
