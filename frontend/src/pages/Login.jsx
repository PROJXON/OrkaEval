import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { saveToken } from '../utils/tokenStore';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';

function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleGoogleLogin = () => {
    setLoading(true);
    const authBase = import.meta.env.VITE_AUTH_BASE_URL || 'https://orkaeval.onrender.com';
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
    <div className="auth-page" style={{ padding: '20px' }}>
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg__grid"></div>
      </div>

      <div className="auth-container">
        <div className="auth-brand anim-float">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size={220} className="mb-4" />
          </Link>
          <p className="mono-tag" style={{ marginBottom: '16px' }}>Enterprise Performance OS</p>
          <p style={{ fontSize: '1.4rem', color: 'var(--clr-text-muted)', marginBottom: '48px', maxWidth: '450px', lineHeight: 1.4, fontWeight: 500 }}>
            Professional performance tracking and competency management for modern teams.
          </p>
          
          <div className="auth-features" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', width: '100%' }}>
             {[
               { icon: '🎯', t: 'Competency Mapping', d: 'Track 5-area growth cycles' },
               { icon: '📊', t: 'JSON Analytics', d: 'Flexible form-based reporting' },
               { icon: '🛡️', t: 'Enterprise Ready', d: 'Secure multi-role management' }
             ].map(f => (
               <div key={f.t} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(10,31,61,0.05)' }}>
                 <span style={{ fontSize: '1.8rem' }}>{f.icon}</span>
                 <div style={{ textAlign: 'left' }}>
                   <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--clr-navy)' }}>{f.t}</div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>{f.d}</div>
                 </div>
               </div>
             ))}
          </div>
        </div>

        <div className="auth-card" style={{ width: '100%' }}>
          <div className="auth-card__inner" style={{ padding: '60px' }}>
            <div className="auth-card__header" style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Welcome Back</h2>
              <p style={{ color: 'var(--clr-text-muted)' }}>Sign in to continue to OrkaEval</p>
            </div>

            <button
              className="btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '16px', borderRadius: '14px', cursor: 'pointer', fontWeight: 600, marginBottom: '32px' }}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="G" />
              Continue with Google
            </button>

            <div className="auth-card__divider" style={{ margin: '32px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="divider-line" style={{ flex: 1, height: '1px' }}></div>
              <span className="mono-tag" style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>OR PASSWORD</span>
              <div className="divider-line" style={{ flex: 1, height: '1px' }}></div>
            </div>

            {error && <div style={{ color: '#ef4444', background: '#fef2f2', padding: '16px', borderRadius: '12px', fontSize: '0.9rem', marginBottom: '24px', border: '1px solid #fee2e2' }}>{error}</div>}

            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', background: '#fff' }}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', background: '#fff' }}
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: '-12px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--clr-azure)', textDecoration: 'none', fontWeight: 700 }}>
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-brand"
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                  marginTop: '10px'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>

            <footer className="auth-card__footer" style={{ marginTop: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--clr-text-muted)' }}>
                Don't have an account? <Link to="/register" style={{ color: 'var(--clr-brand)', fontWeight: 800, textDecoration: 'none' }}>Create one</Link>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;