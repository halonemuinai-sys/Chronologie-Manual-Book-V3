-- Migrasi tambahan: tabel app_settings (tone warna default Viewer publik)
-- Jalankan skrip ini saja di SQL Editor Supabase — tidak perlu re-run seluruh supabase-schema.sql.
-- Aman dijalankan berkali-kali (idempotent).

-- Tabel Pengaturan Aplikasi (baris tunggal, id selalu 1)
CREATE TABLE IF NOT EXISTS chronologie.app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    default_viewer_theme TEXT NOT NULL DEFAULT 'gold',
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT app_settings_single_row CHECK (id = 1)
);

INSERT INTO chronologie.app_settings (id, default_viewer_theme)
VALUES (1, 'gold')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE chronologie.app_settings ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada, agar aman dijalankan ulang
DROP POLICY IF EXISTS "Public read access for app_settings" ON chronologie.app_settings;
DROP POLICY IF EXISTS "Admin update access for app_settings" ON chronologie.app_settings;

CREATE POLICY "Public read access for app_settings"
ON chronologie.app_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin update access for app_settings"
ON chronologie.app_settings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
