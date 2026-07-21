import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { supabase } from '../config/supabaseClient';
import { THEME_OPTIONS, DEFAULT_THEME, isThemeId, type ThemeId } from '../config/themes';
import {
  FolderPlus,
  BookOpen,
  ListPlus,
  LogOut,
  Trash2,
  Plus,
  Upload,
  Link,
  ChevronRight,
  Palette,
  Check,
  QrCode,
  X,
  Download,
  Sun,
  Moon,
  Sparkles,
  Wand2
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

type AdminThemeMode = 'dark' | 'light';
const ADMIN_THEME_STORAGE_KEY = 'adminDashboardTheme';

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Manual {
  id: string;
  brand_id: string;
  title: string;
  slug: string;
  file_path: string;
  theme: string | null;
}

interface TocEntry {
  id: string;
  manual_id: string;
  title: string;
  code: string;
  page_number: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'brands' | 'manuals' | 'toc' | 'theme'>('brands');
  const [sessionLoading, setSessionLoading] = useState(true);

  // Admin panel's own light/dark mode (independent from the public Viewer's tone)
  const [adminThemeMode, setAdminThemeMode] = useState<AdminThemeMode>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY) : null;
    return saved === 'light' ? 'light' : 'dark';
  });

  const handleToggleAdminTheme = () => {
    setAdminThemeMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, next);
      return next;
    });
  };

  // Database Data (Defaulting to 'chronologie' schema configured in supabaseClient.ts)
  const [brands, setBrands] = useState<Brand[]>([]);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);

  // Selected Items for Management
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedManualId, setSelectedManualId] = useState<string>('');

  // Loading States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Site-wide default color tone for the public Viewer
  const [viewerTheme, setViewerTheme] = useState<ThemeId>(DEFAULT_THEME);

  // QR Code modal for a manual's public Viewer link
  const [qrManual, setQrManual] = useState<Manual | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Brand Form State
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');

  // Manual Form State
  const [manualBrandId, setManualBrandId] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualSlug, setManualSlug] = useState('');
  const [manualFilePathType, setManualFilePathType] = useState<'upload' | 'local'>('upload');
  const [manualLocalPath, setManualLocalPath] = useState('');
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [manualTheme, setManualTheme] = useState<'' | ThemeId>('');

  // TOC Form State
  const [tocTitle, setTocTitle] = useState('');
  const [tocCode, setTocCode] = useState('');
  const [tocPageNumber, setTocPageNumber] = useState<number>(1);

  // Authenticate Admin Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/admin');
      } else {
        setSessionLoading(false);
        fetchBrands();
        fetchViewerTheme();
      }
    });
  }, [navigate]);

  // Fetch functions
  const fetchBrands = async () => {
    const { data, error } = await supabase.from('brands').select('*').order('name');
    if (!error && data) setBrands(data);
  };

  const fetchViewerTheme = async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('default_viewer_theme')
      .eq('id', 1)
      .single();
    if (!error && data && isThemeId(data.default_viewer_theme)) {
      setViewerTheme(data.default_viewer_theme);
    }
  };

  const fetchManuals = async (brandId?: string) => {
    let query = supabase.from('manuals').select('*').order('title');
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }
    const { data, error } = await query;
    if (!error && data) {
      setManuals(data);
      if (data.length > 0 && !selectedManualId) {
        setSelectedManualId(data[0].id);
      }
    }
  };

  const fetchTocEntries = async (manualId: string) => {
    if (!manualId) return;
    const { data, error } = await supabase
      .from('toc_entries')
      .select('*')
      .eq('manual_id', manualId)
      .order('page_number');
    if (!error && data) setTocEntries(data);
  };

  // Trigger data fetch on tab/selection change
  useEffect(() => {
    if (activeTab === 'manuals') {
      fetchBrands();
      fetchManuals(selectedBrandId || undefined);
    } else if (activeTab === 'toc') {
      fetchBrands();
      fetchManuals(selectedBrandId || undefined);
    }
  }, [activeTab, selectedBrandId]);

  useEffect(() => {
    if (selectedManualId) {
      fetchTocEntries(selectedManualId);
    } else {
      setTocEntries([]);
    }
  }, [selectedManualId]);

  // Actions
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin');
  };

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Change site-wide default color tone for the public Viewer
  const handleChangeViewerTheme = async (themeId: ThemeId) => {
    const previousTheme = viewerTheme;
    setViewerTheme(themeId);

    const { error } = await supabase
      .from('app_settings')
      .update({ default_viewer_theme: themeId, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) {
      setViewerTheme(previousTheme);
      showMsg(`Gagal mengubah tone warna: ${error.message}`, 'error');
    } else {
      showMsg('Tone warna default Viewer publik berhasil diperbarui.', 'success');
    }
  };

  // Show QR Code for a manual's public Viewer link
  const handleShowQrCode = async (manual: Manual) => {
    setQrManual(manual);
    setQrDataUrl(null);
    setQrLoading(true);
    try {
      const url = `${window.location.origin}/${manual.slug}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: { dark: '#0b0c0e', light: '#ffffff' }
      });
      setQrDataUrl(dataUrl);
    } catch (err: any) {
      showMsg(err.message || 'Gagal membuat QR Code.', 'error');
      setQrManual(null);
    } finally {
      setQrLoading(false);
    }
  };

  const handleCloseQrModal = () => {
    setQrManual(null);
    setQrDataUrl(null);
  };

  // Add Brand
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName || !brandSlug) return;
    setLoading(true);

    const { error } = await supabase.from('brands').insert([
      { name: brandName, slug: brandSlug.toLowerCase().trim() }
    ]);

    setLoading(false);
    if (error) {
      showMsg(`Gagal menambah brand: ${error.message}`, 'error');
    } else {
      showMsg('Brand baru berhasil ditambahkan!', 'success');
      setBrandName('');
      setBrandSlug('');
      fetchBrands();
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus brand ini? Semua buku manual dan daftar isi di dalamnya juga akan terhapus.')) return;

    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) {
      showMsg(`Gagal menghapus: ${error.message}`, 'error');
    } else {
      showMsg('Brand berhasil dihapus.', 'success');
      fetchBrands();
    }
  };

  // Add Manual
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBrandId || !manualTitle || !manualSlug) {
      showMsg('Mohon lengkapi semua kolom wajib.', 'error');
      return;
    }
    setLoading(true);

    let finalFilePath = '';

    try {
      if (manualFilePathType === 'upload') {
        if (!manualFile) {
          throw new Error('Pilih berkas PDF terlebih dahulu untuk diunggah.');
        }

        // Upload to bucket 'chronologie-manuals'
        const cleanSlug = manualSlug.toLowerCase().trim();
        const storagePath = `${cleanSlug}`; // Extensionless filename to bypass IDM

        const { error: uploadError } = await supabase.storage
          .from('chronologie-manuals')
          .upload(storagePath, manualFile, { upsert: true, contentType: 'application/pdf' });

        if (uploadError) {
          throw new Error(`Storage upload error: ${uploadError.message}`);
        }

        // Get public url
        const { data } = supabase.storage.from('chronologie-manuals').getPublicUrl(storagePath);
        finalFilePath = data.publicUrl;
      } else {
        if (!manualLocalPath) {
          throw new Error('Masukkan path file lokal Anda.');
        }
        finalFilePath = manualLocalPath;
      }

      const { error: dbError } = await supabase.from('manuals').insert([
        {
          brand_id: manualBrandId,
          title: manualTitle,
          slug: manualSlug.toLowerCase().trim(),
          file_path: finalFilePath,
          theme: manualTheme || null
        }
      ]);

      if (dbError) throw dbError;

      showMsg('Buku manual baru berhasil disimpan!', 'success');
      setManualTitle('');
      setManualSlug('');
      setManualLocalPath('');
      setManualFile(null);
      setManualTheme('');
      fetchManuals(selectedBrandId || undefined);

    } catch (err: any) {
      showMsg(err.message || 'Gagal menyimpan buku manual.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Change the color tone for a single manual (overrides the global default)
  const handleChangeManualTheme = async (manualId: string, themeId: '' | ThemeId) => {
    const newTheme = themeId || null;
    setManuals(prev => prev.map(m => m.id === manualId ? { ...m, theme: newTheme } : m));

    const { error } = await supabase
      .from('manuals')
      .update({ theme: newTheme })
      .eq('id', manualId);

    if (error) {
      showMsg(`Gagal mengubah tema buku: ${error.message}`, 'error');
      fetchManuals(selectedBrandId || undefined);
    } else {
      showMsg('Tema buku manual berhasil diperbarui.', 'success');
    }
  };

  // Delete Manual
  const handleDeleteManual = async (id: string, filePath: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus buku manual ini beserta semua daftar isinya?')) return;

    setLoading(true);
    try {
      // If file was uploaded to Supabase Storage, try deleting it
      if (filePath.includes('/storage/v1/object/public/chronologie-manuals/')) {
        const urlParts = filePath.split('/chronologie-manuals/');
        if (urlParts.length > 1) {
          const storagePath = urlParts[1];
          await supabase.storage.from('chronologie-manuals').remove([storagePath]);
        }
      }

      const { error } = await supabase.from('manuals').delete().eq('id', id);
      if (error) throw error;

      showMsg('Buku manual berhasil dihapus.', 'success');
      fetchManuals(selectedBrandId || undefined);
    } catch (err: any) {
      showMsg(err.message || 'Gagal menghapus buku manual.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add TOC Entry
  const handleAddTocEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManualId || !tocTitle || !tocCode || !tocPageNumber) {
      showMsg('Mohon lengkapi semua kolom.', 'error');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('toc_entries').insert([
      {
        manual_id: selectedManualId,
        title: tocTitle,
        code: tocCode,
        page_number: tocPageNumber
      }
    ]);

    setLoading(false);
    if (error) {
      showMsg(`Gagal menyimpan daftar isi: ${error.message}`, 'error');
    } else {
      showMsg('Item daftar isi berhasil disimpan!', 'success');
      setTocTitle('');
      setTocCode('');
      setTocPageNumber(tocPageNumber + 1); // auto-increment next page
      fetchTocEntries(selectedManualId);
    }
  };

  // Delete TOC Entry
  const handleDeleteToc = async (id: string) => {
    const { error } = await supabase.from('toc_entries').delete().eq('id', id);
    if (error) {
      showMsg(`Gagal menghapus item: ${error.message}`, 'error');
    } else {
      showMsg('Item daftar isi berhasil dihapus.', 'success');
      fetchTocEntries(selectedManualId);
    }
  };

  // Auto Extract TOC from PDF Outlines
  const handleAutoExtractToc = async () => {
    if (!selectedManualId) return;
    const currentManual = manuals.find(m => m.id === selectedManualId);
    if (!currentManual || !currentManual.file_path) {
      showMsg('File PDF tidak ditemukan pada dokumen ini.', 'error');
      return;
    }

    setLoading(true);
    try {
      const cleanUrl = currentManual.file_path.replace(/\.pdf$/i, '');
      const response = await fetch(cleanUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengunduh berkas PDF dari Supabase Storage (Status HTTP: ${response.status})`);
      }
      const pdfBuffer = await response.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
      const pdfDoc = await loadingTask.promise;
      const outline = await pdfDoc.getOutline();
      const extractedEntries: Array<{ manual_id: string; title: string; code: string; page_number: number }> = [];

      if (outline && outline.length > 0) {
        const processOutline = async (items: any[]) => {
          for (const item of items) {
            let pageNum = 1;
            try {
              if (item.dest) {
                let destRef = item.dest;
                if (typeof item.dest === 'string') {
                  destRef = await pdfDoc.getDestination(item.dest);
                }
                if (Array.isArray(destRef) && destRef[0]) {
                  const pageIndex = await pdfDoc.getPageIndex(destRef[0]);
                  pageNum = pageIndex + 1;
                }
              }
            } catch (e) {
              console.warn('Could not resolve page destination:', item.title, e);
            }

            let code = 'Standard';
            if (item.title) {
              const match = item.title.match(/(fc-[\w\d-]+|cal\.\s*[\w\d-]+|calibre\s*[\w\d-]+|quartz|automatic|gmt|chronograph|moonphase|solar|manual|full calendar|small second)/i);
              if (match) {
                code = match[0];
              } else if (item.title.length <= 15) {
                code = item.title;
              }
            }

            // Keep clean titles under 80 chars
            if (item.title && item.title.trim() && item.title.length < 80) {
              extractedEntries.push({
                manual_id: selectedManualId,
                title: item.title.trim(),
                code: code,
                page_number: pageNum
              });
            }

            if (item.items && Array.isArray(item.items) && item.items.length > 0) {
              await processOutline(item.items);
            }
          }
        };

        await processOutline(outline);
      }

      // If outline yielded fewer than 5 entries, scan page text for Movement/Kaliber headings
      if (extractedEntries.length < 5) {
        const pageEntriesMap = new Map<number, { title: string; code: string }>();

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageStr = textContent.items.map((it: any) => it.str).join(' ');

          const calMatch = pageStr.match(/(?:kaliber|movement\s+kaliber|movement|caliber|kalib)\s*([\w\d\s,\/\-]{2,40})/i);
          if (calMatch) {
            const rawTitle = calMatch[0].replace(/\s+/g, ' ').trim();
            let calCode = 'Kaliber';

            const fcMatch = pageStr.match(/FC-[\w\d\/-]+/i);
            if (fcMatch) {
              calCode = fcMatch[0];
            } else if (calMatch[1]) {
              calCode = calMatch[1].trim().slice(0, 15);
            }

            if (!pageEntriesMap.has(i) && rawTitle.length > 3 && rawTitle.length < 90) {
              pageEntriesMap.set(i, {
                title: rawTitle,
                code: calCode
              });
            }
          }
        }

        pageEntriesMap.forEach((val, pageNum) => {
          extractedEntries.push({
            manual_id: selectedManualId,
            title: val.title,
            code: val.code,
            page_number: pageNum
          });
        });
      }

      if (extractedEntries.length === 0) {
        showMsg('Daftar isi PDF kosong atau tidak dapat diproses secara otomatis.', 'error');
        setLoading(false);
        return;
      }

      // Delete existing entries to prevent duplication
      await supabase.from('toc_entries').delete().eq('manual_id', selectedManualId);

      const { error } = await supabase.from('toc_entries').insert(extractedEntries);
      if (error) throw error;

      showMsg(`Berhasil mengekstrak ${extractedEntries.length} bab dari PDF secara otomatis!`, 'success');
      fetchTocEntries(selectedManualId);
    } catch (err: any) {
      console.error('Auto extract TOC error:', err);
      showMsg(`Gagal mengekstrak PDF: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="admin-shell" data-admin-theme={adminThemeMode} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="spinner" />
          <p style={{ marginLeft: '16px' }}>Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell" data-admin-theme={adminThemeMode}>
      {/* Top Admin Navbar */}
      <header className="admin-header">
        <div className="admin-header-brand">
          <span className="admin-badge-cms">CMS</span>
          <span className="admin-header-title">Chronologie Admin Panel</span>
        </div>

        <div className="admin-header-actions">
          <button
            onClick={handleToggleAdminTheme}
            className="admin-theme-toggle-btn"
            title={adminThemeMode === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
          >
            {adminThemeMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </header>

      {/* Floating Toast Notification */}
      {message && (
        <div className="admin-toast-stack">
          <div className={`admin-toast admin-toast--${message.type}`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      <div className="admin-body">
        {/* Admin Sidebar Navigation */}
        <aside className="admin-sidebar">
          <button
            onClick={() => setActiveTab('brands')}
            className={`admin-nav-btn ${activeTab === 'brands' ? 'is-active' : ''}`}
          >
            <FolderPlus size={16} />
            <span>1. Kelola Brand</span>
          </button>

          <button
            onClick={() => setActiveTab('manuals')}
            className={`admin-nav-btn ${activeTab === 'manuals' ? 'is-active' : ''}`}
          >
            <BookOpen size={16} />
            <span>2. Kelola Buku Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('toc')}
            className={`admin-nav-btn ${activeTab === 'toc' ? 'is-active' : ''}`}
          >
            <ListPlus size={16} />
            <span>3. Kelola Daftar Isi</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`admin-nav-btn ${activeTab === 'theme' ? 'is-active' : ''}`}
          >
            <Palette size={16} />
            <span>4. Tema Viewer Publik</span>
          </button>

          <div className="admin-sidebar-info-box">
            <span className="admin-sidebar-info-title">Info Publik</span>
            <a href="/" target="_blank" className="admin-sidebar-info-link">
              Lihat Portal Utama
              <ChevronRight size={12} />
            </a>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="admin-main">
          {/* TAB 1: BRANDS */}
          {activeTab === 'brands' && (
            <div className="admin-tab-panel">
              <h2 className="admin-section-title">1. Kelola Brand Jam Tangan</h2>

              <div className="admin-grid-2">
                {/* Form Add Brand */}
                <form onSubmit={handleAddBrand} className="admin-card">
                  <h3 className="admin-card-title">Tambah Brand Baru</h3>

                  <div className="admin-field">
                    <label className="admin-label">Nama Brand</label>
                    <input
                      type="text"
                      required
                      placeholder="Cali / Raymond Weil"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Slug URL (Huruf kecil & tanda hubung)</label>
                    <input
                      type="text"
                      required
                      placeholder="cali-raymond-weil"
                      value={brandSlug}
                      onChange={(e) => setBrandSlug(e.target.value)}
                      className="admin-input"
                    />
                  </div>

                  <button type="submit" disabled={loading} className="admin-btn-primary">
                    <Plus size={16} />
                    Simpan Brand
                  </button>
                </form>

                {/* List Brands */}
                <div className="admin-card">
                  <h3 className="admin-card-title">Daftar Brand Aktif</h3>
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th className="admin-th">Nama Brand</th>
                          <th className="admin-th">Slug URL</th>
                          <th className="admin-th" style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brands.map(brand => (
                          <tr key={brand.id} className="admin-tr">
                            <td className="admin-td">{brand.name}</td>
                            <td className="admin-td admin-td-accent">/{brand.slug}</td>
                            <td className="admin-td" style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteBrand(brand.id)}
                                className="admin-icon-btn admin-icon-btn--danger"
                                title="Hapus Brand"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {brands.length === 0 && (
                          <tr>
                            <td colSpan={3} className="admin-empty-row">
                              Belum ada brand terdaftar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUALS */}
          {activeTab === 'manuals' && (
            <div className="admin-tab-panel">
              <h2 className="admin-section-title">2. Kelola Buku Manual (1 PDF per Brand)</h2>

              <div className="admin-grid-2">
                {/* Form Add Manual */}
                <form onSubmit={handleAddManual} className="admin-card">
                  <h3 className="admin-card-title">Tambah Buku Manual</h3>

                  <div className="admin-field">
                    <label className="admin-label">Pilih Brand</label>
                    <select
                      required
                      value={manualBrandId}
                      onChange={(e) => setManualBrandId(e.target.value)}
                      className="admin-select"
                    >
                      <option value="">-- Pilih Brand --</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Judul Buku Manual</label>
                    <input
                      type="text"
                      required
                      placeholder="Raymond Weil Manual Guide"
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Slug Dokumen</label>
                    <input
                      type="text"
                      required
                      placeholder="raymond-weil-manual-guide"
                      value={manualSlug}
                      onChange={(e) => setManualSlug(e.target.value)}
                      className="admin-input"
                    />
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Tema Warna Buku Ini</label>
                    <select
                      value={manualTheme}
                      onChange={(e) => setManualTheme(e.target.value as '' | ThemeId)}
                      className="admin-select"
                    >
                      <option value="">-- Ikuti Tema Default Global --</option>
                      {THEME_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-field">
                    <label className="admin-label">Metode Sumber File PDF</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <label className="admin-radio-label">
                        <input
                          type="radio"
                          checked={manualFilePathType === 'upload'}
                          onChange={() => setManualFilePathType('upload')}
                        />
                        Unggah PDF
                      </label>
                      <label className="admin-radio-label">
                        <input
                          type="radio"
                          checked={manualFilePathType === 'local'}
                          onChange={() => setManualFilePathType('local')}
                        />
                        Gunakan Path Lokal
                      </label>
                    </div>
                  </div>

                  {manualFilePathType === 'upload' ? (
                    <div className="admin-field">
                      <label className="admin-label">Pilih File PDF</label>
                      <div className="admin-upload-box">
                        <Upload size={20} style={{ color: 'var(--admin-accent)', marginBottom: '8px' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', textAlign: 'center' }}>
                          {manualFile ? manualFile.name : 'Klik untuk memilih berkas .pdf'}
                        </span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setManualFile(e.target.files[0]);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer'
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="admin-field">
                      <label className="admin-label">Path File Lokal (di folder /public)</label>
                      <div className="admin-local-path-box">
                        <Link size={14} style={{ color: 'var(--admin-accent)' }} />
                        <input
                          type="text"
                          placeholder="/assets/docs/raymond-weil-manual-guide"
                          value={manualLocalPath}
                          onChange={(e) => setManualLocalPath(e.target.value)}
                          className="admin-local-path-input"
                        />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="admin-btn-primary">
                    <Plus size={16} />
                    Simpan Buku Manual
                  </button>
                </form>

                {/* List Manuals */}
                <div className="admin-card">
                  <div className="admin-card-header-row">
                    <h3 className="admin-card-title" style={{ marginBottom: 0 }}>Daftar Buku Manual</h3>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="admin-select"
                      style={{ width: '200px', padding: '6px 12px' }}
                    >
                      <option value="">Semua Brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th className="admin-th">Judul Buku</th>
                          <th className="admin-th">Slug</th>
                          <th className="admin-th">Tipe File</th>
                          <th className="admin-th">Tema</th>
                          <th className="admin-th">Tautan Berkas</th>
                          <th className="admin-th" style={{ textAlign: 'center', width: '110px' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manuals.map(manual => {
                          const isLocal = !manual.file_path.includes('/storage/v1/object/public/');
                          return (
                            <tr key={manual.id} className="admin-tr">
                              <td className="admin-td">{manual.title}</td>
                              <td className="admin-td admin-td-accent">/{manual.slug}</td>
                              <td className="admin-td">
                                <span className={`admin-badge ${isLocal ? 'admin-badge--gold' : 'admin-badge--blue'}`}>
                                  {isLocal ? 'Lokal' : 'Cloud Storage'}
                                </span>
                              </td>
                              <td className="admin-td">
                                <select
                                  value={manual.theme || ''}
                                  onChange={(e) => handleChangeManualTheme(manual.id, e.target.value as '' | ThemeId)}
                                  className="admin-select"
                                  style={{ padding: '5px 8px', fontSize: '0.78rem', width: '150px' }}
                                >
                                  <option value="">Default Global</option>
                                  {THEME_OPTIONS.map(option => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="admin-td">
                                <a
                                  href={`${window.location.origin}/${manual.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-link"
                                >
                                  Buka Halaman
                                </a>
                              </td>
                              <td className="admin-td" style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <button
                                    onClick={() => handleShowQrCode(manual)}
                                    className="admin-icon-btn admin-icon-btn--accent"
                                    title="Tampilkan QR Code"
                                  >
                                    <QrCode size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteManual(manual.id, manual.file_path)}
                                    className="admin-icon-btn admin-icon-btn--danger"
                                    title="Hapus Buku"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {manuals.length === 0 && (
                          <tr>
                            <td colSpan={6} className="admin-empty-row">
                              Belum ada buku manual terdaftar untuk brand ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOC (TABLE OF CONTENTS) */}
          {activeTab === 'toc' && (
            <div className="admin-tab-panel">
              <h2 className="admin-section-title">3. Kelola Daftar Isi (Lompat Halaman PDF)</h2>

              <div className="admin-filter-bar">
                <div className="admin-filter-field">
                  <label className="admin-filter-label">Filter Brand</label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => {
                      setSelectedBrandId(e.target.value);
                      setSelectedManualId('');
                    }}
                    className="admin-select"
                    style={{ width: '220px' }}
                  >
                    <option value="">-- Pilih Brand --</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-filter-field">
                  <label className="admin-filter-label">Pilih Buku Manual</label>
                  <select
                    value={selectedManualId}
                    onChange={(e) => setSelectedManualId(e.target.value)}
                    disabled={!selectedBrandId}
                    className="admin-select"
                    style={{ width: '300px' }}
                  >
                    <option value="">-- Pilih Buku Manual --</option>
                    {manuals.map(manual => (
                      <option key={manual.id} value={manual.id}>{manual.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedManualId ? (
                <div>
                  {/* Auto Extract Banner Card */}
                  <div className="admin-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(var(--admin-accent-rgb), 0.15), rgba(0, 0, 0, 0.2))', border: '1px solid rgba(var(--admin-accent-rgb), 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--admin-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                          <Sparkles size={18} /> Extrak Daftar Isi Otomatis dari PDF
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', opacity: 0.8, fontFamily: 'Outfit, sans-serif' }}>
                          Sistem akan mengekstrak seluruh Bab & Bookmark bawaan dari berkas PDF dokumen ini dan mengisinya secara otomatis.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoExtractToc}
                        disabled={loading}
                        className="admin-btn-primary"
                        style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-contrast)', padding: '0.6rem 1.2rem', fontWeight: 600 }}
                      >
                        <Wand2 size={16} />
                        {loading ? 'Mengekstrak PDF...' : '⚡ Extrak Daftar Isi Otomatis'}
                      </button>
                    </div>
                  </div>

                  <div className="admin-grid-2">
                  {/* Form Add TOC Entry */}
                  <form onSubmit={handleAddTocEntry} className="admin-card">
                    <h3 className="admin-card-title">Tambah Bab Daftar Isi</h3>

                    <div className="admin-field">
                      <label className="admin-label">Nama Bab (Bahasa)</label>
                      <input
                        type="text"
                        required
                        placeholder="Mekanik Otomatis GMT"
                        value={tocTitle}
                        onChange={(e) => setTocTitle(e.target.value)}
                        className="admin-input"
                      />
                    </div>

                    <div className="admin-field">
                      <label className="admin-label">Kode / Referensi Kaliber</label>
                      <input
                        type="text"
                        required
                        placeholder="Ref. 2761"
                        value={tocCode}
                        onChange={(e) => setTocCode(e.target.value)}
                        className="admin-input"
                      />
                    </div>

                    <div className="admin-field">
                      <label className="admin-label">Nomor Halaman Fisik (PDF)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={tocPageNumber}
                        onChange={(e) => setTocPageNumber(parseInt(e.target.value) || 1)}
                        className="admin-input"
                      />
                    </div>

                    <button type="submit" disabled={loading} className="admin-btn-primary">
                      <Plus size={16} />
                      Simpan Item Bab
                    </button>
                  </form>

                  {/* List TOC Entries */}
                  <div className="admin-card">
                    <h3 className="admin-card-title">Daftar Bab & Halaman PDF</h3>
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th className="admin-th">Halaman</th>
                            <th className="admin-th">Nama Bab</th>
                            <th className="admin-th">Referensi</th>
                            <th className="admin-th" style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tocEntries.map(entry => (
                            <tr key={entry.id} className="admin-tr">
                              <td className="admin-td admin-td-accent" style={{ fontWeight: 700 }}>
                                Hal. {entry.page_number}
                              </td>
                              <td className="admin-td">{entry.title}</td>
                              <td className="admin-td">
                                <span className="admin-badge admin-badge--gold">{entry.code}</span>
                              </td>
                              <td className="admin-td" style={{ textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDeleteToc(entry.id)}
                                  className="admin-icon-btn admin-icon-btn--danger"
                                  title="Hapus Item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {tocEntries.length === 0 && (
                            <tr>
                              <td colSpan={4} className="admin-empty-row">
                                Belum ada bab terdaftar untuk buku ini. Mulai tambahkan melalui form di samping.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              ) : (
                <div className="admin-card admin-empty-panel">
                  <BookOpen size={36} style={{ color: 'var(--admin-accent)', marginBottom: '16px', opacity: 0.7 }} />
                  <h3 style={{ margin: '0 0 8px 0', color: 'var(--admin-text-primary)', fontSize: '1.1rem' }}>Pilih Buku Manual Terlebih Dahulu</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Pilih Brand dan Buku Manual di atas untuk mulai melihat dan mengelola daftar isinya.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: THEME (COLOR TONE FOR PUBLIC VIEWER) */}
          {activeTab === 'theme' && (
            <div className="admin-tab-panel">
              <h2 className="admin-section-title" style={{ marginBottom: '8px' }}>4. Tema Viewer Publik</h2>
              <p className="admin-section-desc">
                Pilih tone warna yang akan dipakai semua pengunjung di halaman Viewer publik. Cocok untuk membedakan
                identitas visual tiap brand (Cali/Raymond Weil, Bvlgari, Omega, dst) saat manual book brand tersebut dirilis.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '20px'
              }}>
                {THEME_OPTIONS.map(option => {
                  const isActive = viewerTheme === option.id;
                  return (
                    <div key={option.id} className={`admin-theme-card ${isActive ? 'is-active' : ''}`}>
                      <div style={{
                        height: '90px',
                        borderRadius: '8px',
                        backgroundColor: option.preview.bg,
                        marginBottom: '14px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          right: '10px',
                          height: '10px',
                          borderRadius: '5px',
                          backgroundColor: option.preview.text,
                          opacity: 0.85
                        }} />
                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '10px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: option.preview.accent
                        }} />
                        <div style={{
                          position: 'absolute',
                          bottom: '18px',
                          left: '52px',
                          right: '12px',
                          height: '8px',
                          borderRadius: '4px',
                          backgroundColor: option.preview.text,
                          opacity: 0.4
                        }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>{option.label}</span>
                        {isActive && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--admin-success)', fontWeight: 600 }}>
                            <Check size={13} />
                            Aktif
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isActive}
                        onClick={() => handleChangeViewerTheme(option.id)}
                        className={`admin-theme-card-btn ${isActive ? 'is-active' : ''}`}
                      >
                        {isActive ? 'Sedang Dipakai' : 'Jadikan Aktif'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* QR Code Modal */}
      {qrManual && (
        <div className="admin-modal-backdrop" onClick={handleCloseQrModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--admin-text-primary)' }}>QR Code Buku Manual</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>{qrManual.title}</p>
              </div>
              <button onClick={handleCloseQrModal} className="admin-icon-btn admin-icon-btn--muted" title="Tutup">
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {qrLoading || !qrDataUrl ? (
                <div style={{ width: '256px', height: '256px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="spinner" />
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`QR Code untuk ${qrManual.title}`}
                  style={{ width: '256px', height: '256px', borderRadius: '8px', backgroundColor: '#fff', padding: '10px' }}
                />
              )}

              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--admin-accent)', textAlign: 'center', wordBreak: 'break-all' }}>
                {window.location.origin}/{qrManual.slug}
              </p>

              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`qr-${qrManual.slug}.png`}
                  className="admin-btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={16} />
                  Unduh QR Code (PNG)
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
