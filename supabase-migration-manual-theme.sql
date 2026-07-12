-- Migrasi tambahan: kolom theme per buku manual
-- Jalankan skrip ini saja di SQL Editor Supabase — tidak perlu re-run seluruh supabase-schema.sql.
-- Aman dijalankan berkali-kali (idempotent).

ALTER TABLE chronologie.manuals
ADD COLUMN IF NOT EXISTS theme TEXT;

COMMENT ON COLUMN chronologie.manuals.theme IS
'Tone warna khusus buku ini (gold/ocean/emerald/rose/bvlgari/omega). NULL = ikut tema default global di app_settings.';
