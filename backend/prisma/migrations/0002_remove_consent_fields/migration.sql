-- Migration: remove consent fields from users
-- Drops consent_given_at and consent_version columns if they exist
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "consent_given_at";
ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "consent_version";
