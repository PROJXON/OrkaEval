import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandler';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      return toast.error('Invalid or missing reset token. Please request a new link.');
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const payload = {
        token,
        newPassword: formData.password
      };

      await resetPassword(payload);
      toast.success('Password reset successfully! You can now log in.');
      navigate('/');
    } catch (err) {
      handleApiError(err, 'Reset failed');
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
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '24px' }}>Secure Reset</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--clr-text-muted)', marginBottom: '48px', maxWidth: '400px' }}>
            Choose a strong, unique password to keep your OrkaEval account and data safe.
          </p>
          
          <div className="auth-features" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
             {[
               { icon: '🔑', t: 'Strong Encryption', d: 'Industrial grade password hashing' },
               { icon: '🚀', t: 'Instant Access', d: 'Login immediately after reset' }
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
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>New Password</h2>
              <p>Set your new account credentials.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="New password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn-brand"
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: 'var(--clr-brand)', color: '#fff', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s', boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)' }}
              >
                {loading ? 'Updating password...' : 'Update Password →'}
              </button>
            </form>

            <footer className="auth-card__footer" style={{ marginTop: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem' }}>Changed your mind? <Link to="/" style={{ color: 'var(--clr-brand)', fontWeight: 700, textDecoration: 'none' }}>Back to login</Link></p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
