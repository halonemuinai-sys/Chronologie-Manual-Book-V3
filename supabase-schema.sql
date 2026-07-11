-- SQL Schema untuk Portal Chronologie Manual Book V2
-- Jalankan kode ini di SQL Editor dashboard Supabase Anda.

-- ======================================================
-- 1. Pembuatan Tabel
-- ======================================================

-- Tabel Brands
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Manuals (1 PDF per Brand)
CREATE TABLE IF NOT EXISTS public.manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    file_path TEXT NOT NULL, -- Menyimpan URL/path berkas PDF
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel Table of Contents (Daftar Isi per Manual)
CREATE TABLE IF NOT EXISTS public.toc_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manual_id UUID REFERENCES public.manuals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code TEXT NOT NULL, -- Kode referensi seperti Ref. 2761
    page_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ======================================================
-- 2. Aktifkan Row Level Security (RLS)
-- ======================================================
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toc_entries ENABLE ROW LEVEL SECURITY;

-- ======================================================
-- 3. Pembuatan Policy (Kebijakan Akses)
-- ======================================================

-- Policy untuk tabel BRANDS
CREATE POLICY "Public read access for brands" 
ON public.brands FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for brands" 
ON public.brands FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy untuk tabel MANUALS
CREATE POLICY "Public read access for manuals" 
ON public.manuals FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for manuals" 
ON public.manuals FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy untuk tabel TOC_ENTRIES
CREATE POLICY "Public read access for toc_entries" 
ON public.toc_entries FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Admin full access for toc_entries" 
ON public.toc_entries FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- ======================================================
-- 4. Contoh Pengisian Data Awal (Optional Seed)
-- ======================================================
-- Jalankan ini untuk memasukkan data Raymond Weil & Cali sebagai data awal.

/*
INSERT INTO public.brands (id, name, slug) 
VALUES ('c34752c0-82cc-4993-85bb-41cfb262d5f8', 'Cali / Raymond Weil', 'cali-raymond-weil')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.manuals (id, brand_id, title, slug, file_path)
VALUES (
    'd83769c0-93dd-5004-96cc-52dfc273e6f9', 
    'c34752c0-82cc-4993-85bb-41cfb262d5f8', 
    'Raymond Weil Manual Guide', 
    'raymond-weil-manual-guide', 
    '/assets/docs/raymond-weil-manual-guide'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.toc_entries (manual_id, title, code, page_number) VALUES
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
