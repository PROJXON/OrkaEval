import { useState } from 'react';
import { requestPasswordReset } from '../api';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandler';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    
    setLoading(true);
    try {
      const data = await requestPasswordReset(email);
      toast.success(data.message);
      
      // DEV MODE: If the backend returned a token, generate a local link
      if (data.devResetToken) {
        setDevResetUrl(`/reset-password?token=${data.devResetToken}`);
      }
    } catch (err) {
      handleApiError(err, 'Request failed');
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
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '24px' }}>Account Recovery</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--clr-text-muted)', marginBottom: '48px', maxWidth: '400px' }}>
            Enter your email address and we'll help you get back into your account safely.
          </p>
          
          <div className="auth-features" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             {[
               { icon: '🔒', t: 'Secure Reset', d: 'One-time encrypted links' },
               { icon: '🛡️', t: 'Privacy First', d: 'No data shared with third parties' }
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
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Forgot Password?</h2>
              <p>We'll send a reset link to your inbox.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || !!devResetUrl}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none' }}
                />
              </div>

              {!devResetUrl ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-brand"
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: 'var(--clr-brand)', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s', boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)' }}
                >
                  {loading ? 'Sending link...' : 'Send Reset Link →'}
                </button>
              ) : (
                <div style={{ padding: '24px', background: 'var(--clr-brand-glow)', borderRadius: '12px', border: '1px solid var(--clr-brand)', marginTop: '8px', animation: 'anim-slide-up 0.4s ease' }}>
                  <p style={{ fontSize: '0.85rem', marginBottom: '16px', color: 'var(--clr-text)', lineHeight: 1.5 }}>
                    <strong>Dev Mode:</strong> SMTP is not configured. Use the link below to bypass email and reset now.
                  </p>
                  <Link to={devResetUrl} className="btn-brand" style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '12px', borderRadius: '8px', background: 'var(--clr-brand)', color: '#fff', fontWeight: 700 }}>
                    Proceed to Reset
                  </Link>
                </div>
              )}
            </form>

            <footer className="auth-card__footer" style={{ marginTop: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem' }}>Remember your password? <Link to="/" style={{ color: 'var(--clr-brand)', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link></p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
