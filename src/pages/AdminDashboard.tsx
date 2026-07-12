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
  Download
} from 'lucide-react';

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

  if (sessionLoading) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#0b0c0e',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <div className="spinner" />
        <p style={{ marginLeft: '16px' }}>Memeriksa autentikasi...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0c0e',
      color: '#e2e8f0',
      fontFamily: 'Outfit, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Admin Navbar */}
      <header style={{
        height: '64px',
        backgroundColor: '#121316',
        borderBottom: '1px solid rgba(197, 168, 128, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            backgroundColor: '#c5a880',
            color: '#0b0c0e',
            padding: '3px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            CMS
          </span>
          <span style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem' }}>
            Chronologie Admin Panel
          </span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Outfit, sans-serif'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <LogOut size={14} />
          Keluar
        </button>
      </header>

      {/* Main Panel Content */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Admin Sidebar Navigation */}
        <aside style={{
          width: '240px',
          backgroundColor: '#111215',
          borderRight: '1px solid rgba(197, 168, 128, 0.08)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('brands')}
            className={`admin-side-btn ${activeTab === 'brands' ? 'active' : ''}`}
            style={sideBtnStyle(activeTab === 'brands')}
          >
            <FolderPlus size={16} />
            <span>1. Kelola Brand</span>
          </button>

          <button
            onClick={() => setActiveTab('manuals')}
            className={`admin-side-btn ${activeTab === 'manuals' ? 'active' : ''}`}
            style={sideBtnStyle(activeTab === 'manuals')}
          >
            <BookOpen size={16} />
            <span>2. Kelola Buku Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('toc')}
            className={`admin-side-btn ${activeTab === 'toc' ? 'active' : ''}`}
            style={sideBtnStyle(activeTab === 'toc')}
          >
            <ListPlus size={16} />
            <span>3. Kelola Daftar Isi</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`admin-side-btn ${activeTab === 'theme' ? 'active' : ''}`}
            style={sideBtnStyle(activeTab === 'theme')}
          >
            <Palette size={16} />
            <span>4. Tema Viewer Publik</span>
          </button>

          <div style={{ marginTop: 'auto', padding: '16px', backgroundColor: '#18191c', borderRadius: '8px', border: '1px solid rgba(197, 168, 128, 0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#c5a880', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Info Publik</span>
            <a 
              href="/" 
              target="_blank" 
              style={{ fontSize: '0.8rem', color: '#a1a1aa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#a1a1aa'}
            >
              Lihat Portal Utama
              <ChevronRight size={12} />
            </a>
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {message && (
            <div style={{
              backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              color: message.type === 'success' ? '#4ade80' : '#f87171',
              padding: '14px 20px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              marginBottom: '24px',
              lineHeight: 1.5
            }}>
              {message.text}
            </div>
          )}

          {/* TAB 1: BRANDS */}
          {activeTab === 'brands' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
                1. Kelola Brand Jam Tangan
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
                {/* Form Add Brand */}
                <form onSubmit={handleAddBrand} style={formBoxStyle}>
                  <h3 style={formTitleStyle}>Tambah Brand Baru</h3>
                  
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Nama Brand</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Cali / Raymond Weil" 
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Slug URL (Huruf kecil & tanda hubung)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="cali-raymond-weil" 
                      value={brandSlug}
                      onChange={(e) => setBrandSlug(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <button type="submit" disabled={loading} style={btnStyle}>
                    <Plus size={16} />
                    Simpan Brand
                  </button>
                </form>

                {/* List Brands */}
                <div style={formBoxStyle}>
                  <h3 style={formTitleStyle}>Daftar Brand Aktif</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Nama Brand</th>
                          <th style={thStyle}>Slug URL</th>
                          <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brands.map(brand => (
                          <tr key={brand.id} style={trStyle}>
                            <td style={tdStyle}>{brand.name}</td>
                            <td style={{ ...tdStyle, color: '#c5a880' }}>/{brand.slug}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <button 
                                onClick={() => handleDeleteBrand(brand.id)}
                                style={deleteBtnStyle}
                                title="Hapus Brand"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {brands.length === 0 && (
                          <tr>
                            <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#a1a1aa', padding: '30px' }}>
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
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
                2. Kelola Buku Manual (1 PDF per Brand)
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
                {/* Form Add Manual */}
                <form onSubmit={handleAddManual} style={formBoxStyle}>
                  <h3 style={formTitleStyle}>Tambah Buku Manual</h3>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Pilih Brand</label>
                    <select
                      required
                      value={manualBrandId}
                      onChange={(e) => setManualBrandId(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">-- Pilih Brand --</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Judul Buku Manual</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Raymond Weil Manual Guide" 
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Slug Dokumen</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="raymond-weil-manual-guide" 
                      value={manualSlug}
                      onChange={(e) => setManualSlug(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Tema Warna Buku Ini</label>
                    <select
                      value={manualTheme}
                      onChange={(e) => setManualTheme(e.target.value as '' | ThemeId)}
                      style={selectStyle}
                    >
                      <option value="">-- Ikuti Tema Default Global --</option>
                      {THEME_OPTIONS.map(option => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={formFieldStyle}>
                    <label style={labelStyle}>Metode Sumber File PDF</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          checked={manualFilePathType === 'upload'}
                          onChange={() => setManualFilePathType('upload')}
                        />
                        Unggah PDF
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
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
                    <div style={formFieldStyle}>
                      <label style={labelStyle}>Pilih File PDF</label>
                      <div style={fileUploadBoxStyle}>
                        <Upload size={20} style={{ color: '#c5a880', marginBottom: '8px' }} />
                        <span style={{ fontSize: '0.8rem', color: '#a1a1aa', textAlign: 'center' }}>
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
                    <div style={formFieldStyle}>
                      <label style={labelStyle}>Path File Lokal (di folder /public)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#18191c', borderRadius: '8px', border: '1px solid rgba(197, 168, 128, 0.15)', padding: '4px 12px' }}>
                        <Link size={14} style={{ color: '#c5a880' }} />
                        <input 
                          type="text" 
                          placeholder="/assets/docs/raymond-weil-manual-guide" 
                          value={manualLocalPath}
                          onChange={(e) => setManualLocalPath(e.target.value)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 4px',
                            flex: 1,
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={loading} style={btnStyle}>
                    <Plus size={16} />
                    Simpan Buku Manual
                  </button>
                </form>

                {/* List Manuals */}
                <div style={formBoxStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ ...formTitleStyle, marginBottom: 0 }}>Daftar Buku Manual</h3>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      style={{ ...selectStyle, width: '200px', padding: '6px 12px' }}
                    >
                      <option value="">Semua Brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Judul Buku</th>
                          <th style={thStyle}>Slug</th>
                          <th style={thStyle}>Tipe File</th>
                          <th style={thStyle}>Tema</th>
                          <th style={thStyle}>Tautan Berkas</th>
                          <th style={{ ...thStyle, textAlign: 'center', width: '110px' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manuals.map(manual => {
                          const isLocal = !manual.file_path.includes('/storage/v1/object/public/');
                          return (
                            <tr key={manual.id} style={trStyle}>
                              <td style={tdStyle}>{manual.title}</td>
                              <td style={{ ...tdStyle, color: '#c5a880' }}>/{manual.slug}</td>
                              <td style={tdStyle}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  backgroundColor: isLocal ? 'rgba(197, 168, 128, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                                  color: isLocal ? '#c5a880' : '#60a5fa',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}>
                                  {isLocal ? 'Lokal' : 'Cloud Storage'}
                                </span>
                              </td>
                              <td style={tdStyle}>
                                <select
                                  value={manual.theme || ''}
                                  onChange={(e) => handleChangeManualTheme(manual.id, e.target.value as '' | ThemeId)}
                                  style={{ ...selectStyle, padding: '5px 8px', fontSize: '0.78rem', width: '150px' }}
                                >
                                  <option value="">Default Global</option>
                                  {THEME_OPTIONS.map(option => (
                                    <option key={option.id} value={option.id}>{option.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td style={tdStyle}>
                                <a
                                  href={`${window.location.origin}/${manual.slug}`}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={{ color: '#c5a880', textDecoration: 'underline', fontSize: '0.8rem' }}
                                >
                                  Buka Halaman
                                </a>
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <button
                                    onClick={() => handleShowQrCode(manual)}
                                    style={qrBtnStyle}
                                    title="Tampilkan QR Code"
                                  >
                                    <QrCode size={15} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteManual(manual.id, manual.file_path)}
                                    style={deleteBtnStyle}
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
                            <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#a1a1aa', padding: '30px' }}>
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
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>
                3. Kelola Daftar Isi (Lompat Halaman PDF)
              </h2>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', backgroundColor: '#121316', padding: '16px 20px', borderRadius: '8px', border: '1px solid rgba(197, 168, 128, 0.08)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600 }}>Filter Brand</label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => {
                      setSelectedBrandId(e.target.value);
                      setSelectedManualId('');
                    }}
                    style={{ ...selectStyle, width: '220px' }}
                  >
                    <option value="">-- Pilih Brand --</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 600 }}>Pilih Buku Manual</label>
                  <select
                    value={selectedManualId}
                    onChange={(e) => setSelectedManualId(e.target.value)}
                    disabled={!selectedBrandId}
                    style={{ ...selectStyle, width: '300px' }}
                  >
                    <option value="">-- Pilih Buku Manual --</option>
                    {manuals.map(manual => (
                      <option key={manual.id} value={manual.id}>{manual.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedManualId ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
                  {/* Form Add TOC Entry */}
                  <form onSubmit={handleAddTocEntry} style={formBoxStyle}>
                    <h3 style={formTitleStyle}>Tambah Bab Daftar Isi</h3>

                    <div style={formFieldStyle}>
                      <label style={labelStyle}>Nama Bab (Bahasa)</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Mekanik Otomatis GMT" 
                        value={tocTitle}
                        onChange={(e) => setTocTitle(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={formFieldStyle}>
                      <label style={labelStyle}>Kode / Referensi Kaliber</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ref. 2761" 
                        value={tocCode}
                        onChange={(e) => setTocCode(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div style={formFieldStyle}>
                      <label style={labelStyle}>Nomor Halaman Fisik (PDF)</label>
                      <input 
                        type="number" 
                        required 
                        min={1}
                        value={tocPageNumber}
                        onChange={(e) => setTocPageNumber(parseInt(e.target.value) || 1)}
                        style={inputStyle}
                      />
                    </div>

                    <button type="submit" disabled={loading} style={btnStyle}>
                      <Plus size={16} />
                      Simpan Item Bab
                    </button>
                  </form>

                  {/* List TOC Entries */}
                  <div style={formBoxStyle}>
                    <h3 style={formTitleStyle}>Daftar Bab & Halaman PDF</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Halaman</th>
                            <th style={thStyle}>Nama Bab</th>
                            <th style={thStyle}>Referensi</th>
                            <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tocEntries.map(entry => (
                            <tr key={entry.id} style={trStyle}>
                              <td style={{ ...tdStyle, fontWeight: 700, color: '#c5a880' }}>
                                Hal. {entry.page_number}
                              </td>
                              <td style={tdStyle}>{entry.title}</td>
                              <td style={tdStyle}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  backgroundColor: 'rgba(197, 168, 128, 0.1)',
                                  color: '#c5a880',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}>
                                  {entry.code}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <button 
                                  onClick={() => handleDeleteToc(entry.id)}
                                  style={deleteBtnStyle}
                                  title="Hapus Item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {tocEntries.length === 0 && (
                            <tr>
                              <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#a1a1aa', padding: '30px' }}>
                                Belum ada bab terdaftar untuk buku ini. Mulai tambahkan melalui form di samping.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ ...formBoxStyle, padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
                  <BookOpen size={36} style={{ color: '#c5a880', marginBottom: '16px', opacity: 0.7 }} />
                  <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.1rem' }}>Pilih Buku Manual Terlebih Dahulu</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>Pilih Brand dan Buku Manual di atas untuk mulai melihat dan mengelola daftar isinya.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: THEME (COLOR TONE FOR PUBLIC VIEWER) */}
          {activeTab === 'theme' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                4. Tema Viewer Publik
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '24px', maxWidth: '640px', lineHeight: 1.6 }}>
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
                    <div key={option.id} style={themeCardStyle(isActive)}>
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
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{option.label}</span>
                        {isActive && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#4ade80', fontWeight: 600 }}>
                            <Check size={13} />
                            Aktif
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isActive}
                        onClick={() => handleChangeViewerTheme(option.id)}
                        style={themeCardBtnStyle(isActive)}
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
        <div style={qrModalBackdropStyle} onClick={handleCloseQrModal}>
          <div style={qrModalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>QR Code Buku Manual</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#a1a1aa' }}>{qrManual.title}</p>
              </div>
              <button onClick={handleCloseQrModal} style={qrCloseBtnStyle} title="Tutup">
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

              <p style={{ margin: 0, fontSize: '0.75rem', color: '#c5a880', textAlign: 'center', wordBreak: 'break-all' }}>
                {window.location.origin}/{qrManual.slug}
              </p>

              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`qr-${qrManual.slug}.png`}
                  style={{ ...btnStyle, width: '100%', textDecoration: 'none' }}
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

// Styling helpers
const sideBtnStyle = (isActive: boolean) => ({
  width: '100%',
  backgroundColor: isActive ? 'rgba(197, 168, 128, 0.12)' : 'transparent',
  border: 'none',
  color: isActive ? '#fff' : '#94a3b8',
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: isActive ? 600 : 500,
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  textAlign: 'left' as const,
  transition: 'all 0.2s',
  fontFamily: 'Outfit, sans-serif'
});

const formBoxStyle = {
  backgroundColor: '#121316',
  border: '1px solid rgba(197, 168, 128, 0.08)',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
};

const formTitleStyle = {
  fontSize: '1.05rem',
  fontWeight: 600,
  color: '#fff',
  marginTop: 0,
  marginBottom: '20px',
  letterSpacing: '0.01em'
};

const formFieldStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '6px',
  marginBottom: '16px'
};

const labelStyle = {
  fontSize: '0.8rem',
  color: '#94a3b8',
  fontWeight: 500
};

const inputStyle = {
  backgroundColor: '#18191c',
  border: '1px solid rgba(197, 168, 128, 0.15)',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'Outfit, sans-serif'
};

const selectStyle = {
  backgroundColor: '#18191c',
  border: '1px solid rgba(197, 168, 128, 0.15)',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'Outfit, sans-serif'
};

const fileUploadBoxStyle = {
  border: '2px dashed rgba(197, 168, 128, 0.25)',
  borderRadius: '8px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#18191c',
  position: 'relative' as const,
  cursor: 'pointer'
};

const btnStyle = {
  width: '100%',
  backgroundColor: '#c5a880',
  color: '#0b0c0e',
  border: 'none',
  padding: '12px',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.875rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  marginTop: '8px',
  fontFamily: 'Outfit, sans-serif'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: '0.875rem'
};

const thStyle = {
  borderBottom: '1px solid rgba(197, 168, 128, 0.15)',
  color: '#94a3b8',
  fontWeight: 600,
  textAlign: 'left' as const,
  padding: '10px 12px'
};

const trStyle = {
  borderBottom: '1px solid rgba(197, 168, 128, 0.05)',
  transition: 'background-color 0.2s'
};

const tdStyle = {
  padding: '12px',
  color: '#e2e8f0',
  verticalAlign: 'middle'
};

const themeCardStyle = (isActive: boolean) => ({
  backgroundColor: '#121316',
  border: `1px solid ${isActive ? '#c5a880' : 'rgba(197, 168, 128, 0.08)'}`,
  borderRadius: '12px',
  padding: '16px',
  boxShadow: isActive ? '0 0 0 1px rgba(197, 168, 128, 0.3)' : '0 4px 20px rgba(0,0,0,0.15)',
  transition: 'border-color 0.2s, box-shadow 0.2s'
});

const themeCardBtnStyle = (isActive: boolean) => ({
  width: '100%',
  backgroundColor: isActive ? 'transparent' : '#c5a880',
  color: isActive ? '#4ade80' : '#0b0c0e',
  border: isActive ? '1px solid rgba(74, 222, 128, 0.3)' : 'none',
  padding: '9px',
  borderRadius: '8px',
  fontWeight: 600,
  fontSize: '0.8rem',
  cursor: isActive ? 'default' : 'pointer',
  transition: 'background-color 0.2s',
  fontFamily: 'Outfit, sans-serif'
});

const deleteBtnStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#f87171',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s'
};

const qrBtnStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#c5a880',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s'
};

const qrModalBackdropStyle = {
  position: 'fixed' as const,
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px'
};

const qrModalStyle = {
  backgroundColor: '#121316',
  border: '1px solid rgba(197, 168, 128, 0.15)',
  borderRadius: '12px',
  padding: '24px',
  width: '100%',
  maxWidth: '360px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
};

const qrCloseBtnStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};
