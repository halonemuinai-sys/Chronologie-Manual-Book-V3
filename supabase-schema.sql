-- SQL Schema untuk Portal Chronologie Manual Book V2 (Isolasi penuh dalam schema 'chronologie')
-- Jalankan seluruh kode ini di SQL Editor dashboard Supabase Anda.

-- ======================================================
-- 1. Pembuatan Schema Baru
-- ======================================================
CREATE SCHEMA IF NOT EXISTS chronologie;

-- ======================================================
-- 2. Pembuatan Tabel di Dalam Schema 'chronologie'
-- ======================================================

-- Tabel Brands
CREATE TABLE IF NOT EXISTS chronologie.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Manuals
CREATE TABLE IF NOT EXISTS chronologie.manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES chronologie.brands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    file_path TEXT NOT NULL, -- Menyimpan URL berkas PDF
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Table of Contents (Daftar Isi per Manual)
CREATE TABLE IF NOT EXISTS chronologie.toc_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manual_id UUID REFERENCES chronologie.manuals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code TEXT NOT NULL, -- Kode referensi seperti Ref. 2761
    page_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ======================================================
-- 3. Aktifkan Row Level Security (RLS)
-- ======================================================
ALTER TABLE chronologie.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronologie.manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronologie.toc_entries ENABLE ROW LEVEL SECURITY;

-- ======================================================
-- 4. Pembuatan Policy (Kebijakan Akses Database)
-- ======================================================

-- Policy untuk tabel brands
CREATE POLICY "Public read access for brands" 
ON chronologie.brands FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for brands" 
ON chronologie.brands FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy untuk tabel manuals
CREATE POLICY "Public read access for manuals" 
ON chronologie.manuals FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for manuals" 
ON chronologie.manuals FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy untuk tabel toc_entries
CREATE POLICY "Public read access for toc_entries" 
ON chronologie.toc_entries FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for toc_entries" 
ON chronologie.toc_entries FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ======================================================
-- 5. Pembuatan Storage Bucket & Policy (Public Bucket)
-- ======================================================

-- Buat bucket 'chronologie-manuals' secara otomatis
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chronologie-manuals', 'chronologie-manuals', true)
ON CONFLICT (id) DO NOTHING;

-- Hapus policy lama jika ada untuk menghindari konflik penamaan
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;

-- Kebijakan Baca Publik Storage
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'chronologie-manuals');

-- Kebijakan Unggah Admin Storage (Authenticated)
CREATE POLICY "Admin Upload Access" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chronologie-manuals');

-- Kebijakan Update Admin Storage (Authenticated)
CREATE POLICY "Admin Update Access" ON storage.objects
FOR UPDATE TO authenticated
WITH CHECK (bucket_id = 'chronologie-manuals');

-- Kebijakan Hapus Admin Storage (Authenticated)
CREATE POLICY "Admin Delete Access" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'chronologie-manuals');

-- ======================================================
-- 6. Pengisian Data Awal (Optional Seed)
-- ======================================================
-- Hilangkan tanda komentar (/* ... */) jika ingin memasukkan data awal Raymond Weil langsung dari SQL Editor.

/*
INSERT INTO chronologie.brands (id, name, slug) 
VALUES ('c34752c0-82cc-4993-85bb-41cfb262d5f8', 'Cali / Raymond Weil', 'cali-raymond-weil')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO chronologie.manuals (id, brand_id, title, slug, file_path)
VALUES (
    'd83769c0-93dd-5004-96cc-52dfc273e6f9', 
    'c34752c0-82cc-4993-85bb-41cfb262d5f8', 
    'Raymond Weil Manual Guide', 
    'raymond-weil-manual-guide', 
    'https://vekgzcxorvdidjutuvrj.supabase.co/storage/v1/object/public/chronologie-manuals/raymond-weil-manual-guide'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO chronologie.toc_entries (manual_id, title, code, page_number) VALUES
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis GMT', 'Ref. 2761', 3),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis GMT Worldtimer', 'Ref. 2765', 10),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis Kalender Lengkap', 'Ref. 2765 / 2766-2', 17),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Putar Manual', 'Ref. 2880', 27),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis Moon Phase', 'Ref. 2945 & 2145', 34),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis Kronograf Tri-Compax', 'Ref. 7741', 40),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanikal Otomatis Standard', 'Ref. 7754', 47),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis Kronograf Bi-Compax', 'Ref. 7780', 53),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis Kronograf Flyback', 'Ref. 7783', 60),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis Jarum Tanggal & Moonphase', 'Jarum Tanggal', 66),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanikal Otomatis dengan Tanggal', 'Auto Tanggal', 77),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanik Otomatis Kalender Lengkap & Moonphase', 'Full Calendar', 86),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanikal Otomatis Moonphase & Tanggal', 'Moonphase Date', 99),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanikal Otomatis Standard', 'Auto Standard', 108),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Mekanikal Otomatis Small Second', 'Small Second', 115),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Quartz Standard', 'Quartz', 124),
('d83769c0-93dd-5004-96cc-52dfc273e6f9', 'Quartz Shine', 'Quartz Shine', 136);
*/
