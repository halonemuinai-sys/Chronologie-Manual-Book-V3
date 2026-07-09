import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { 
  Menu, 
  X, 
  Search, 
  Download, 
  Info
} from 'lucide-react';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

const workerUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface ManualItem {
  slug: string;
  file: string;
  title: string;
  brand: string;
  cleanedTitle: string;
  code: string;
  page: number;
}

// Table of Contents page mapping for the single main PDF file
const tocMapping: Record<string, { page: number; title: string; code: string }> = {
  "raymond-weil-manual-guide": {
    page: 1,
    title: "Raymond Weil Manual Guide",
    code: "Full Book"
  },
  "cali-2761-gmt": {
    page: 3,
    title: "Jam Tangan Mekanik Otomatis dengan Fungsi GMT",
    code: "Ref. 2761"
  },
  "cali-2765-gmt-worldtimer": {
    page: 10,
    title: "Jam Tangan Mekanik Otomatis dengan Fungsi GMT Worldtimer",
    code: "Ref. 2765"
  },
  "cali-2766-2": {
    page: 17,
    title: "Jam Tangan Mekanik Otomatis dengan Kalender Lengkap",
    code: "Ref. 2765 / 2766-2"
  },
  "cali-2880": {
    page: 27,
    title: "Jam Tangan Mekanik Putar Manual",
    code: "Ref. 2880"
  },
  "cali-2945-2145-moonphase": {
    page: 34,
    title: "Jam Tangan Mekanik Otomatis (Self-Winding) dengan Fase Bulan",
    code: "Ref. 2945 & 2145"
  },
  "cali-7741-chrono": {
    page: 40,
    title: "Jam Tangan Mekanik Otomatis dengan Fungsi Kronograf Tri-Compax",
    code: "Ref. 7741"
  },
  "cali-7754": {
    page: 47,
    title: "Jam Tangan Mekanikal Otomatis",
    code: "Ref. 7754"
  },
  "cali-7780-chrono": {
    page: 53,
    title: "Jam Tangan Mekanik Otomatis dengan Fungsi Kronograf Bi-Compax & Tanggal",
    code: "Ref. 7780"
  },
  "cali-7783-flyback": {
    page: 60,
    title: "Jam Tangan Mekanik Otomatis dengan Fungsi Kronograf Flyback",
    code: "Ref. 7783"
  },
  "cali-mech-auto-with-date-hand-and-moonphase": {
    page: 66,
    title: "Jam Tangan Mekanis Pemutar Otomatis dengan Jarum Tanggal / Jarum Tanggal & Fase Bulan",
    code: "Jarum Tanggal / Moonphase"
  },
  "cali-mech-auto-with-date": {
    page: 77,
    title: "Jam Tangan Mekanikal Otomatis dengan Tanggal",
    code: "Auto Tanggal"
  },
  "cali-mech-auto-with-daydateweekmonth-moonphase": {
    page: 86,
    title: "Jam Tangan Mekanis Pemutar Otomatis dengan Indikator Tanggal, Hari, Minggu, Bulan, & Fase Bulan",
    code: "Auto Full Calendar"
  },
  "cali-mech-auto-with-moonphase-date": {
    page: 99,
    title: "Jam Tangan Mekanikal Otomatis dengan Fase Bulan dan Tanggal",
    code: "Auto Moonphase & Tanggal"
  },
  "cali-mech-automatic": {
    page: 108,
    title: "Jam Tangan Mekanikal Otomatis",
    code: "Auto Standard"
  },
  "cali-mech-small-seconds": {
    page: 115,
    title: "Jam Tangan Mekanis Pemutar Otomatis dengan Indikator Tanggal & Jarum Detik Kecil (Small Second)",
    code: "Auto Small Second"
  },
  "cali-quartz-2": {
    page: 124,
    title: "Jam Tangan Quartz",
    code: "Quartz"
  },
  "cali-quartz-shine": {
    page: 136,
    title: "Jam Tangan Quartz Shine",
    code: "Quartz Shine"
  }
};

export default function AppViewer() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Process catalog items based on static Table of Contents
  const manualsList = useMemo((): ManualItem[] => {
    return Object.entries(tocMapping).map(([key, value]) => {
      const isFullGuide = key === 'raymond-weil-manual-guide';
      return {
        slug: key,
        file: "raymond-weil-manual-guide", // All routes read the same source file
        title: value.title,
        brand: isFullGuide ? 'Raymond Weil' : 'Cali / Raymond Weil',
        cleanedTitle: value.title,
        code: value.code,
        page: value.page
      };
    });
  }, []);

  const defaultSlug = 'raymond-weil-manual-guide';
  const activeSlug = slug || defaultSlug;

  const activeManual = useMemo(() => {
    const found = manualsList.find(item => item.slug === activeSlug);
    return found || manualsList.find(item => item.slug === defaultSlug) || manualsList[0];
  }, [manualsList, activeSlug]);

  // Main PDF File to fetch
  const pdfUrl = '/assets/docs/raymond-weil-manual-guide';

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // PDF Data state
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch the single main PDF once on start-up
  useEffect(() => {
    setPdfLoading(true);
    setFetchError(null);
    setPdfData(null);

    fetch(pdfUrl)
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
  }, []);

  // Initialize page-navigation plugin
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const { jumpToPage } = pageNavigationPluginInstance;

  // Trigger jumpToPage when activeSlug or pdfData changes
  useEffect(() => {
    if (pdfData && activeSlug) {
      const entry = tocMapping[activeSlug];
      if (entry) {
        const timer = setTimeout(() => {
          jumpToPage(entry.page - 1); // jumpToPage is 0-indexed
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [activeSlug, pdfData]);

  // Filtered Cali manuals (excluding the full book link itself in search filters)
  const filteredManuals = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const caliList = manualsList.filter(item => item.slug !== 'raymond-weil-manual-guide');

    if (!query) return caliList;
    return caliList.filter(
      item =>
        item.cleanedTitle.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query)
    );
  }, [manualsList, searchQuery]);

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
    <div className="app-shell">
      <div className="viewer-mobile-container">
        {/* Top Navbar */}
        <header className="viewer-navbar">
          <div className="navbar-left">
            <button 
              className="navbar-toggle-sidebar-btn" 
              onClick={() => setIsDrawerOpen(true)}
              title="Buka Daftar Isi"
            >
              <Menu size={20} />
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
                  plugins={[pageNavigationPluginInstance]}
                />
              </div>
            </Worker>
          ) : (
            <div className="canvas-loading">
              <p>Tidak ada dokumen yang dimuat.</p>
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
            <span className="drawer-title">Daftar Isi Buku</span>
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
              {/* Special Full Book Link */}
              <button
                className={`catalog-item-btn ${activeSlug === 'raymond-weil-manual-guide' ? 'is-active' : ''}`}
                onClick={() => handleSelectManual('raymond-weil-manual-guide')}
                style={{ marginBottom: '0.75rem', border: '1px solid rgba(68, 42, 7, 0.15)' }}
              >
                <div className="item-dot" />
                <span className="item-title" style={{ fontWeight: 700 }}>[Buku Lengkap] Raymond Weil Manual Guide</span>
              </button>

              <div className="brand-header-simple">
                Daftar Isi Cali / Raymond Weil <span>({filteredManuals.length})</span>
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
                        <span className="item-title" style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }}>
                          {item.cleanedTitle}
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        color: '#8f6f3f', 
                        fontWeight: 600, 
                        flexShrink: 0,
                        backgroundColor: 'rgba(143, 111, 63, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {item.code}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredManuals.length === 0 && (
                <div className="catalog-no-results">
                  <Info size={20} style={{ color: '#c5a880', marginBottom: '8px' }} />
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
