import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { supabase } from './config/supabaseClient';
import { DEFAULT_THEME, isThemeId, type ThemeId } from './config/themes';
import {
  X,
  Search,
  Download,
  Info,
  BookOpen,
  ChevronDown,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Maximize
} from 'lucide-react';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';

const workerUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface ManualItem {
  slug: string;
  file: string;
  title: string;
  brand: string;
  cleanedTitle: string;
  code: string;
  page: number;
  theme?: string | null;
}

// Table of Contents page mapping for the single main PDF file (Static Fallback)
const tocMapping: Record<string, { page: number; title: string; code: string }> = {
  "raymond-weil-manual-guide": {
    page: 1,
    title: "Raymond Weil Manual Guide",
    code: "Full Book"
  },
  "cali-2761-gmt": {
    page: 3,
    title: "Mekanik Otomatis GMT",
    code: "Ref. 2761"
  },
  "cali-2765-gmt-worldtimer": {
    page: 10,
    title: "Mekanik Otomatis GMT Worldtimer",
    code: "Ref. 2765"
  },
  "cali-2766-2": {
    page: 17,
    title: "Mekanik Otomatis Kalender Lengkap",
    code: "Ref. 2765 / 2766-2"
  },
  "cali-2880": {
    page: 27,
    title: "Mekanik Putar Manual",
    code: "Ref. 2880"
  },
  "cali-2945-2145-moonphase": {
    page: 34,
    title: "Mekanik Otomatis Moon Phase",
    code: "Ref. 2945 & 2145"
  },
  "cali-7741-chrono": {
    page: 40,
    title: "Mekanik Otomatis Kronograf Tri-Compax",
    code: "Ref. 7741"
  },
  "cali-7754": {
    page: 47,
    title: "Mekanikal Otomatis Standard",
    code: "Ref. 7754"
  },
  "cali-7780-chrono": {
    page: 53,
    title: "Mekanik Otomatis Kronograf Bi-Compax",
    code: "Ref. 7780"
  },
  "cali-7783-flyback": {
    page: 60,
    title: "Mekanik Otomatis Kronograf Flyback",
    code: "Ref. 7783"
  },
  "cali-mech-auto-with-date-hand-and-moonphase": {
    page: 66,
    title: "Mekanik Otomatis Jarum Tanggal & Moonphase",
    code: "Jarum Tanggal"
  },
  "cali-mech-auto-with-date": {
    page: 77,
    title: "Mekanikal Otomatis dengan Tanggal",
    code: "Auto Tanggal"
  },
  "cali-mech-auto-with-daydateweekmonth-moonphase": {
    page: 86,
    title: "Mekanik Otomatis Kalender Lengkap & Moonphase",
    code: "Full Calendar"
  },
  "cali-mech-auto-with-moonphase-date": {
    page: 99,
    title: "Mekanikal Otomatis Moonphase & Tanggal",
    code: "Moonphase Date"
  },
  "cali-mech-automatic": {
    page: 108,
    title: "Mekanikal Otomatis Standard",
    code: "Auto Standard"
  },
  "cali-mech-small-seconds": {
    page: 115,
    title: "Mekanikal Otomatis Small Second",
    code: "Small Second"
  },
  "cali-quartz-2": {
    page: 124,
    title: "Quartz Standard",
    code: "Quartz"
  },
  "cali-quartz-shine": {
    page: 136,
    title: "Quartz Shine",
    code: "Quartz Shine"
  }
};

export default function AppViewer() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Site-wide default color tone — controlled by the admin from the Dashboard.
  // A manual can override this with its own theme (see activeManual.theme below).
  const [globalDefaultTheme, setGlobalDefaultTheme] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    const loadDefaultTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('default_viewer_theme')
          .eq('id', 1)
          .single();
        if (error) throw error;
        if (data && isThemeId(data.default_viewer_theme)) {
          setGlobalDefaultTheme(data.default_viewer_theme);
        }
      } catch (err) {
        console.warn('Failed to load default viewer theme from Supabase, using local default. Error:', err);
      }
    };

    loadDefaultTheme();
  }, []);

  // Process static catalog items (Static Fallback)
  const staticManualsList = useMemo((): ManualItem[] => {
    return Object.entries(tocMapping).map(([key, value]) => {
      const isFullGuide = key === 'raymond-weil-manual-guide';
      return {
        slug: key,
        file: "/assets/docs/raymond-weil-manual-guide", // All routes read the same source file
        title: value.title,
        brand: isFullGuide ? 'Raymond Weil' : 'Cali / Raymond Weil',
        cleanedTitle: value.title,
        code: value.code,
        page: value.page
      };
    });
  }, []);

  // Supabase dynamic states
  const [dynamicManualsList, setDynamicManualsList] = useState<ManualItem[]>([]);
  const [dynamicTocMapping, setDynamicTocMapping] = useState<Record<string, { page: number; title: string; code: string }>>({});
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);

  // Fetch dynamic data from Supabase if configured
  useEffect(() => {
    const loadSupabaseData = async () => {
      try {
        const { data: dbBrands, error: brandsError } = await supabase.from('brands').select('*');
        if (brandsError) throw brandsError;

        const { data: dbManuals, error: manualsError } = await supabase.from('manuals').select('*');
        if (manualsError) throw manualsError;

        const { data: dbToc, error: tocError } = await supabase.from('toc_entries').select('*');
        if (tocError) throw tocError;

        if (dbBrands && dbManuals && dbToc && dbManuals.length > 0) {
          const list: ManualItem[] = [];
          const mappingObj: Record<string, { page: number; title: string; code: string }> = {};

          dbManuals.forEach(manual => {
            const brand = dbBrands.find(b => b.id === manual.brand_id);
            const brandName = brand ? brand.name : 'Unknown';

            // Register the base full manual book (starts at page 1)
            mappingObj[manual.slug] = {
              page: 1,
              title: manual.title,
              code: 'Full Book'
            };

            list.push({
              slug: manual.slug,
              file: manual.file_path,
              title: manual.title,
              brand: brandName,
              cleanedTitle: manual.title,
              code: 'Full Book',
              page: 1,
              theme: manual.theme
            });

            // Register all TOC entries linked to this manual
            const entries = dbToc.filter(t => t.manual_id === manual.id);
            entries.forEach(entry => {
              // Create a unique slug for each chapter under this manual
              const entrySlug = `${manual.slug}-${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${entry.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
              
              mappingObj[entrySlug] = {
                page: entry.page_number,
                title: entry.title,
                code: entry.code
              };

              list.push({
                slug: entrySlug,
                file: manual.file_path,
                title: entry.title,
                brand: brandName,
                cleanedTitle: entry.title,
                code: entry.code,
                page: entry.page_number,
                theme: manual.theme
              });
            });
          });

          setDynamicManualsList(list);
          setDynamicTocMapping(mappingObj);
          setIsUsingSupabase(true);
        }
      } catch (err) {
        console.warn('Failed to load data from Supabase, falling back to static mapping. Error:', err);
      }
    };

    loadSupabaseData();
  }, []);

  // Determine active datasets (Supabase vs Fallback)
  const activeManualsList = useMemo(() => {
    return isUsingSupabase ? dynamicManualsList : staticManualsList;
  }, [isUsingSupabase, dynamicManualsList, staticManualsList]);

  const activeTocMapping = useMemo(() => {
    return isUsingSupabase ? dynamicTocMapping : tocMapping;
  }, [isUsingSupabase, dynamicTocMapping, tocMapping]);

  const defaultSlug = 'raymond-weil-manual-guide';
  const activeSlug = slug || (isUsingSupabase ? (dynamicManualsList[0]?.slug || defaultSlug) : defaultSlug);

  const activeManual = useMemo(() => {
    const found = activeManualsList.find(item => item.slug === activeSlug);
    return found || activeManualsList.find(item => item.slug === defaultSlug) || activeManualsList[0];
  }, [activeManualsList, activeSlug]);

  // A manual's own theme (set in Admin) overrides the site-wide default.
  const resolvedTheme = useMemo((): ThemeId => {
    if (activeManual?.theme && isThemeId(activeManual.theme)) {
      return activeManual.theme;
    }
    return globalDefaultTheme;
  }, [activeManual, globalDefaultTheme]);

  // Main PDF File to fetch
  const pdfUrl = useMemo(() => {
    return activeManual ? activeManual.file : '/assets/docs/raymond-weil-manual-guide';
  }, [activeManual]);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Initialize plugins
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  const zoomPluginInstance = zoomPlugin();
  const { ZoomIn, ZoomOut, Zoom } = zoomPluginInstance;

  // PDF Data state
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch the active PDF when pdfUrl changes
  useEffect(() => {
    if (!pdfUrl) return;

    setPdfLoading(true);
    setFetchError(null);
    setPdfData(null);

    // Strip .pdf extension to prevent IDM interception
    const cleanFetchUrl = pdfUrl.replace(/\.pdf$/, '');

    fetch(cleanFetchUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Gagal mengunduh berkas PDF (Status: ${response.status})`);
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        setPdfData(new Uint8Array(buffer));
        setPdfLoading(false);
      })
      .catch(err => {
        console.error('Fetch PDF Error:', err);
        setFetchError(err.message || 'Gagal memuat dokumen PDF');
        setPdfLoading(false);
      });
  }, [pdfUrl]);



  // Trigger jumpToPage when activeSlug or pdfData changes
  useEffect(() => {
    if (pdfData && activeSlug) {
      const entry = activeTocMapping[activeSlug];
      if (entry) {
        const timer = setTimeout(() => {
          jumpToPage(entry.page - 1); // jumpToPage is 0-indexed
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [activeSlug, pdfData, activeTocMapping, jumpToPage]);

  // Filtered manuals list (excluding full book links in search filters)
  const filteredManuals = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const list = activeManualsList.filter(item => item.code !== 'Full Book');

    if (!query) return list;
    return list.filter(
      item =>
        item.cleanedTitle.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query)
    );
  }, [activeManualsList, searchQuery]);

  // Handle click on manual item
  const handleSelectManual = (targetSlug: string) => {
    navigate(`/${targetSlug}`);
    setIsDrawerOpen(false); // Close bottom drawer on select
  };

  if (!activeManual) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#0b0c0e',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#c5a880', fontSize: '3rem', margin: '0 0 10px 0' }}>404</h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, margin: '0 0 20px 0' }}>Dokumen Tidak Ditemukan</h2>
        <button 
          onClick={() => navigate('/')} 
          style={{
            backgroundColor: '#c5a880',
            color: '#0b0c0e',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif'
          }}
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell" data-theme={resolvedTheme}>
      <div className="viewer-mobile-container">
        {/* Top Navbar */}
        <header className="viewer-navbar">
          <div className="navbar-left">
            <button 
              className="navbar-toggle-sidebar-btn" 
              onClick={() => setIsDrawerOpen(true)}
              title="Buka Katalog Manual Book"
            >
              <BookOpen size={16} />
              <span className="navbar-toggle-btn-text">Katalog</span>
              <ChevronDown size={14} style={{ opacity: 0.7 }} />
            </button>
            <div className="navbar-doc-info">
              <span className="navbar-brand-badge">{activeManual.brand}</span>
              <h1 className="navbar-doc-title" title={activeManual.cleanedTitle}>
                {activeManual.cleanedTitle}
              </h1>
            </div>
          </div>

          <div className="navbar-right">
            <a
              href={`/download/${activeManual.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-download-btn"
              title="Unduh file PDF"
            >
              <Download size={16} />
            </a>
          </div>
        </header>

        {/* PDF Reader Canvas */}
        <div className="viewer-canvas-container">
          {pdfLoading ? (
            <div className="canvas-loading">
              <div className="spinner" />
              <p>Membaca dokumen secara aman...</p>
            </div>
          ) : fetchError ? (
            <div className="canvas-loading" style={{ color: '#f87171', padding: '20px', textAlign: 'center' }}>
              <p style={{ fontWeight: 600, marginBottom: '8px' }}>Gagal memuat PDF</p>
              <p style={{ fontSize: '0.8rem', color: '#a1a1aa', lineHeight: 1.5 }}>{fetchError}</p>
            </div>
          ) : pdfData ? (
            <Worker workerUrl={workerUrl}>
              <div className="pdf-viewer-core-wrapper">
                <Viewer
                  fileUrl={pdfData}
                  theme="dark"
                  defaultScale={SpecialZoomLevel.PageWidth}
                  plugins={[pageNavigationPluginInstance, zoomPluginInstance]}
                />
              </div>
            </Worker>
          ) : (
            <div className="canvas-loading">
              <p>Tidak ada dokumen yang dimuat.</p>
            </div>
          )}

          {/* Floating Zoom Controls */}
          {pdfData && !pdfLoading && !fetchError && (
            <div className="floating-zoom-toolbar">
              <ZoomOut>
                {(props) => (
                  <button 
                    onClick={props.onClick} 
                    className="zoom-btn"
                    title="Zoom Out"
                  >
                    <ZoomOutIcon size={16} />
                  </button>
                )}
              </ZoomOut>
              <Zoom>
                {(props) => (
                  <span className="zoom-text">
                    {`${Math.round(props.scale * 100)}%`}
                  </span>
                )}
              </Zoom>
              <ZoomIn>
                {(props) => (
                  <button 
                    onClick={props.onClick} 
                    className="zoom-btn"
                    title="Zoom In"
                  >
                    <ZoomInIcon size={16} />
                  </button>
                )}
              </ZoomIn>
              <div className="zoom-divider" />
              <button 
                onClick={() => zoomPluginInstance.zoomTo(SpecialZoomLevel.PageWidth)} 
                className="zoom-btn reset"
                title="Fit to Width"
              >
                <Maximize size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Drawer Overlay Backdrop */}
        {isDrawerOpen && (
          <div 
            className="drawer-backdrop" 
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Bottom Drawer Panel */}
        <div className={`drawer-panel ${isDrawerOpen ? 'is-open' : 'is-closed'}`}>
          {/* Visual Pull Handle */}
          <div className="drawer-handle" />

          {/* Drawer Header */}
          <div className="drawer-header">
            <span className="drawer-title">Katalog Manual Book</span>
            <button className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Search Box */}
          <div className="sidebar-search-container" style={{ padding: '0.75rem 1rem' }}>
            <div className="sidebar-search-box">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Cari kaliber jam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="search-clear-btn">
                  Bersihkan
                </button>
              )}
            </div>
          </div>

          {/* Catalog Content Scroll Area */}
          <div className="sidebar-content-scroll" style={{ padding: '0.75rem 1rem' }}>
            <div className="catalog-list">
              {/* Full Books Links Section */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="brand-header-simple" style={{ marginBottom: '0.5rem' }}>
                  Pilih Buku Lengkap
                </div>
                {activeManualsList.filter(item => item.code === 'Full Book').map(item => (
                  <button
                    key={item.slug}
                    className={`catalog-item-btn ${activeSlug === item.slug ? 'is-active' : ''}`}
                    onClick={() => handleSelectManual(item.slug)}
                    style={{ marginBottom: '0.5rem', border: '1px solid rgba(var(--color-accent-rgb), 0.35)' }}
                  >
                    <div className="item-dot" />
                    <span className="item-title" style={{ fontWeight: 700 }}>[Buku Lengkap] {item.title}</span>
                  </button>
                ))}
              </div>

              {/* Chapters list by Brand */}
              <div className="brand-header-simple">
                Daftar Isi Seri Jam <span>({filteredManuals.length})</span>
              </div>
              <div className="catalog-items-flat">
                {filteredManuals.map(item => {
                  const isActive = item.slug === activeSlug;
                  return (
                    <button
                      key={item.slug}
                      className={`catalog-item-btn ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleSelectManual(item.slug)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                        <div className="item-dot" />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                          <span className="catalog-item-brand-label">
                            {item.brand}
                          </span>
                          <span className="item-title" style={{ 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            marginTop: '1px'
                          }}>
                            {item.cleanedTitle}
                          </span>
                        </div>
                      </div>
                      <span className="catalog-item-code-badge">
                        {item.code}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredManuals.length === 0 && (
                <div className="catalog-no-results">
                  <Info size={20} style={{ color: 'var(--color-accent)', marginBottom: '8px' }} />
                  <p>Tidak ada manual book yang cocok.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
