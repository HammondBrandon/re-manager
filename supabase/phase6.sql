-- Phase 6: Expand contacts table for SOI migration

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS client_rating TEXT CHECK (client_rating IN ('A+', 'A', 'B', 'C')),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS anniversary DATE,
  ADD COLUMN IF NOT EXISTS spouse_first_name TEXT,
  ADD COLUMN IF NOT EXISTS spouse_last_name TEXT,
  ADD COLUMN IF NOT EXISTS spouse_email TEXT,
  ADD COLUMN IF NOT EXISTS spouse_phone TEXT,
  ADD COLUMN IF NOT EXISTS second_email TEXT,
  ADD COLUMN IF NOT EXISTS second_phone TEXT;
