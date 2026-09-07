-- Migration: add consent fields to users
-- Run this SQL on your PostgreSQL database to add the new columns for LGPD consent tracking

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "consent_given_at" TIMESTAMP WITH TIME ZONE NULL;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "consent_version" TEXT NULL;
