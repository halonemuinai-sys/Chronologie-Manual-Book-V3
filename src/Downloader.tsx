import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mapping from './config/mapping.json';

export default function Downloader() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const activeDoc = useMemo(() => {
    if (!slug) return null;
    return (mapping as Record<string, { file: string, title: string }>)[slug];
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    if (!activeDoc) {
      setError('Document Not Found');
      return;
    }

    // Fetch the extensionless file and trigger client-side download
    const cleanFileUrl = `/assets/docs/${activeDoc.file.replace(/\.pdf$/, '')}`;

    fetch(cleanFileUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Gagal mengunduh berkas (Status: ${response.status})`);
        }
        return response.blob();
      })
      .then(blob => {
        // Create an Object URL for the blob
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${activeDoc.title}.pdf`; // Re-attach .pdf extension for the saved file
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
  }, [slug, activeDoc, navigate]);

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
        File PDF manual <span style={{ color: '#c5a880', fontWeight: 500 }}>{activeDoc?.title}</span> sedang diproses dan akan otomatis tersimpan.
      </p>
    </div>
  );
}
