import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin/dashboard');
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Sign In Error:', signInError);
      setError(signInError.message || 'Login gagal. Periksa kembali email dan password.');
      setLoading(false);
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0c0e',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Outfit, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#121316',
        borderRadius: '16px',
        border: '1px solid rgba(197, 168, 128, 0.12)',
        padding: '40px 30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#c5a880',
            letterSpacing: '0.15em',
            display: 'block',
            marginBottom: '8px'
          }}>
            Chronologie CMS
          </span>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 600,
            color: '#ffffff',
            margin: 0
          }}>
            Log In Admin
          </h2>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#f87171',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 500 }}>
              Alamat Email
            </label>
            <input
              type="email"
              required
              placeholder="admin@chronologie.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                backgroundColor: '#18191c',
                border: '1px solid rgba(197, 168, 128, 0.15)',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'Outfit, sans-serif'
              }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                backgroundColor: '#18191c',
                border: '1px solid rgba(197, 168, 128, 0.15)',
                color: '#fff',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'Outfit, sans-serif'
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#c5a880',
              color: '#0b0c0e',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              marginTop: '10px',
              transition: 'background-color 0.2s',
              fontFamily: 'Outfit, sans-serif'
            }}
          >
            {loading ? 'Masuk...' : 'Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
