import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './config/supabaseClient';
import mapping from './config/mapping.json';

export default function Downloader() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');

  useEffect(() => {
    if (!slug) return;

    const loadDownload = async () => {
      try {
        // 1. Try querying direct manual book by slug in Supabase
        const { data: manualData, error: manualError } = await supabase
          .from('chronologie_manuals')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!manualError && manualData) {
          setDocTitle(manualData.title);
          triggerDownload(manualData.file_path, manualData.title);
          return;
        }

        // 2. If it's a TOC entry slug, query all manuals to find if slug starts with manual slug
        const { data: allManuals, error: allManualsError } = await supabase
          .from('chronologie_manuals')
          .select('*');

        if (!allManualsError && allManuals) {
          const parent = allManuals.find(m => slug.startsWith(m.slug));
          if (parent) {
            setDocTitle(parent.title);
            triggerDownload(parent.file_path, parent.title);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to static mapping.json');
      }

      // 3. Static local mapping fallback
      const localDoc = (mapping as Record<string, { file: string, title: string }>)[slug];
      if (localDoc) {
        setDocTitle(localDoc.title);
        triggerDownload(`/assets/docs/${localDoc.file}`, localDoc.title);
      } else {
        setError('Dokumen tidak ditemukan');
      }
    };

    const triggerDownload = (url: string, title: string) => {
      const cleanFileUrl = url.replace(/\.pdf$/, '');

      fetch(cleanFileUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Gagal mengunduh berkas (Status: ${response.status})`);
          }
          return response.blob();
        })
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${title}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);

          // Auto-navigate back to the viewer after initiating download
          const returnTimer = setTimeout(() => {
            navigate(`/${slug}`);
          }, 1500);

          return () => clearTimeout(returnTimer);
        })
        .catch(err => {
          console.error('Download Error:', err);
          setError(err.message || 'Gagal mengunduh dokumen PDF');
        });
    };

    loadDownload();
  }, [slug, navigate]);

  if (error) {
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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 500, margin: '0 0 20px 0' }}>Unduhan Gagal</h2>
        <p style={{ color: '#a1a1aa', maxWidth: '400px', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 30px 0' }}>
          Terjadi kesalahan saat memproses unduhan: {error}
        </p>
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
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#0b0c0e', 
      color: '#fff', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      fontFamily: 'Outfit, -apple-system, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div className="spinner" style={{ marginBottom: '24px' }} />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#ffffff', margin: '0 0 8px 0', letterSpacing: '0.01em' }}>
        Mengunduh Dokumen...
      </h2>
      <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: 0, fontWeight: 300 }}>
        File PDF manual <span style={{ color: '#c5a880', fontWeight: 500 }}>{docTitle || 'Sedang diproses'}</span> sedang diproses dan akan otomatis tersimpan.
      </p>
    </div>
  );
}
