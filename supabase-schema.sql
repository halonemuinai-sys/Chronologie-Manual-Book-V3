-- SQL Schema untuk Portal Chronologie Manual Book V2 (Prefiks chronologie_ agar tidak merusak data lain)
-- Jalankan kode ini di SQL Editor dashboard Supabase Anda.

-- ======================================================
-- 1. Pembuatan Tabel dengan Prefiks chronologie_
-- ======================================================

-- Tabel Brands
CREATE TABLE IF NOT EXISTS public.chronologie_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Manuals
CREATE TABLE IF NOT EXISTS public.chronologie_manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.chronologie_brands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    file_path TEXT NOT NULL, -- Menyimpan URL berkas PDF
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Table of Contents (Daftar Isi per Manual)
CREATE TABLE IF NOT EXISTS public.chronologie_toc_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manual_id UUID REFERENCES public.chronologie_manuals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code TEXT NOT NULL, -- Kode referensi seperti Ref. 2761
    page_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ======================================================
-- 2. Aktifkan Row Level Security (RLS)
-- ======================================================
ALTER TABLE public.chronologie_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronologie_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronologie_toc_entries ENABLE ROW LEVEL SECURITY;

-- ======================================================
-- 3. Pembuatan Policy (Kebijakan Akses)
-- ======================================================

-- Policy untuk tabel chronologie_brands
CREATE POLICY "Public read access for chronologie_brands" 
ON public.chronologie_brands FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for chronologie_brands" 
ON public.chronologie_brands FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy untuk tabel chronologie_manuals
CREATE POLICY "Public read access for chronologie_manuals" 
ON public.chronologie_manuals FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for chronologie_manuals" 
ON public.chronologie_manuals FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy untuk tabel chronologie_toc_entries
CREATE POLICY "Public read access for chronologie_toc_entries" 
ON public.chronologie_toc_entries FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for chronologie_toc_entries" 
ON public.chronologie_toc_entries FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ======================================================
-- 4. Contoh Pengisian Data Awal (Optional Seed)
-- ======================================================
-- Jalankan ini jika ingin mengisi data awal Cali & Raymond Weil secara otomatis ke tabel baru Anda.

/*
INSERT INTO public.chronologie_brands (id, name, slug) 
VALUES ('c34752c0-82cc-4993-85bb-41cfb262d5f8', 'Cali / Raymond Weil', 'cali-raymond-weil')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.chronologie_manuals (id, brand_id, title, slug, file_path)
VALUES (
    'd83769c0-93dd-5004-96cc-52dfc273e6f9', 
    'c34752c0-82cc-4993-85bb-41cfb262d5f8', 
    'Raymond Weil Manual Guide', 
    'raymond-weil-manual-guide', 
    '/assets/docs/raymond-weil-manual-guide'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.chronologie_toc_entries (manual_id, title, code, page_number) VALUES
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
