import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

function Register() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    startDate: new Date().toISOString().split('T')[0],
    profileType: 'both',
    coachId: ''
  });
  const [coaches, setCoaches] = useState([]);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const res = await api.get('/auth/coaches');
        setCoaches(res.data);
      } catch (err) {
        console.error("Failed to load coaches", err);
      }
    };
    fetchCoaches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Clean data before sending
      const submissionData = { ...formData };
      if (submissionData.coachId === '') {
        delete submissionData.coachId;
      } else {
        submissionData.coachId = parseInt(submissionData.coachId);
      }

      await api.post('/auth/register', submissionData);
      toast.success('Registration successful! Please login.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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

      <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '100%', margin: 0, gap: 0 }}>
        <div className="auth-card" style={{ maxWidth: '480px', width: '100%', margin: '20px', animation: 'slideUp 0.6s ease-out' }}>
          <div className="auth-card__inner" style={{ padding: '48px' }}>
            <div className="auth-card__header" style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Logo size={140} className="mb-4" />
              </Link>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Create Account</h2>
              <p style={{ fontSize: '0.95rem' }}>Join the OrkaEval Performance Review Platform</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--clr-text-muted)' }}>FULL NAME</label>
                <input
                  name="displayName"
                  type="text"
                  required
                  placeholder="Kill Bill"
                  value={formData.displayName}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', color: 'var(--clr-text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--clr-text-muted)' }}>EMAIL ADDRESS</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="killbill@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', color: 'var(--clr-text)', fontSize: '1rem', outline: 'none' }}
                />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--clr-text-muted)' }}>PASSWORD</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '14px', paddingRight: '48px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', color: 'var(--clr-text)', fontSize: '1rem', outline: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '38px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--clr-text-muted)' }}>START DATE</label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', color: 'var(--clr-text)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>



              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                  background: 'var(--clr-brand)', color: '#fff', fontSize: '1.125rem', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer', transition: '0.2s', marginTop: '10px',
                  boxShadow: '0 8px 25px rgba(37, 99, 235, 0.35)'
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </form>

            <div className="auth-card__divider" style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--clr-border)' }}></div>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 500 }}>Already have an account?</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--clr-border)' }}></div>
            </div>

            <Link to="/" style={{ display: 'block', textAlign: 'center', color: 'var(--clr-brand)', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
