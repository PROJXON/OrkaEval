import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { saveToken } from '../utils/tokenStore';
import { useUser } from '../context/UserContext';

function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleGoogleLogin = () => {
    setLoading(true);
    const authBase = import.meta.env.VITE_AUTH_BASE_URL || 'http://127.0.0.1:5000';
    const isElectron = !!window.electron;
    const returnParam = isElectron ? 'returnUrl=electron' : '';
    window.location.href = `${authBase}/api/auth/google${returnParam ? '?' + returnParam : ''}`;
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      saveToken(response.data.token);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg__grid"></div>
        <div className="auth-bg__orb auth-bg__orb--1"></div>
        <div className="auth-bg__orb auth-bg__orb--2"></div>
        <div className="auth-bg__orb auth-bg__orb--3"></div>
        <div className="auth-bg__noise"></div>
      </div>

      <div className="auth-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: '1000px', width: '100%', alignItems: 'center', gap: '64px' }}>
        <div className="auth-brand">
          <div className="auth-brand__logo" style={{ width: '80px', height: '80px', marginBottom: '32px' }}>
            <img src="/assets/orkaeval-logo.png" alt="OrkaEval" style={{ width: '100%', height: '100%' }} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '24px' }}>OrkaEval</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--clr-text-muted)', marginBottom: '48px', maxWidth: '400px' }}>
            Professional performance tracking and competency management for modern teams.
          </p>
          
          <div className="auth-features" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             {[
               { icon: '🎯', t: 'Competency Mapping', d: 'Track 5-area growth cycles' },
               { icon: '📊', t: 'JSON Analytics', d: 'Flexible form-based reporting' },
               { icon: '🛡️', t: 'Enterprise Ready', d: 'Secure multi-role management' }
             ].map(f => (
               <div key={f.t} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                 <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                 <div>
                   <div style={{ fontWeight: 700 }}>{f.t}</div>
                   <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{f.d}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="auth-card" style={{ maxWidth: '440px', width: '100%' }}>
          <div className="auth-card__inner" style={{ padding: '48px' }}>
            <div className="auth-card__header" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>

            <button
              className="btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '14px', borderRadius: '12px', border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', cursor: 'pointer', fontWeight: 600, marginBottom: '24px' }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" height="18" alt="G" />
              Continue with Google
            </button>

            <div className="auth-card__divider" style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--clr-border)' }}></div>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or password</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--clr-border)' }}></div>
            </div>

            {error && <div style={{ color: '#ef4444', background: '#fef2f2', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #fee2e2' }}>{error}</div>}

            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', textDecoration: 'none', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-brand"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: 'var(--clr-brand)', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s', boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)' }}
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>

            <footer className="auth-card__footer" style={{ marginTop: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem' }}>Don't have an account? <Link to="/register" style={{ color: 'var(--clr-brand)', fontWeight: 700, textDecoration: 'none' }}>Create one</Link></p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;