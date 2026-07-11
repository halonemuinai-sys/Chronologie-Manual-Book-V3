import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Viewer from './Viewer';
import Downloader from './Downloader';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/download/:slug" element={<Downloader />} />
        <Route path="/:slug" element={<Viewer />} />
        <Route path="/" element={<Viewer />} />
        <Route path="*" element={
          <div className="not-found" style={{ color: '#fff', textAlign: 'center', marginTop: '100px', fontFamily: 'Outfit, sans-serif' }}>
            <h1 style={{ fontSize: '3rem', color: '#c5a880', marginBottom: '10px' }}>404</h1>
            <p style={{ color: '#a1a1aa' }}>Dokumen tidak ditemukan</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
