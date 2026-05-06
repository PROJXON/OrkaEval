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
    profileType: 'candidate',
    coachId: ''
  });
  const [coaches, setCoaches] = useState([]);
  const navigate = useNavigate();

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
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none' }}
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
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--clr-text-muted)' }}>PASSWORD</label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none' }}
                />
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
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--clr-text-muted)' }}>ROLE</label>
                  <select
                    name="profileType"
                    value={formData.profileType}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '0.9rem', outline: 'none', appearance: 'none' }}
                  >
                    <option value="candidate">Candidate</option>
                    <option value="coach">Coach</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              {(formData.profileType === 'candidate' || formData.profileType === 'both') && (
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--clr-text-muted)' }}>SELECT YOUR COACH</label>
                  <select
                    name="coachId"
                    required
                    value={formData.coachId}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--clr-border)', background: 'var(--clr-bg-2)', fontSize: '1rem', outline: 'none', appearance: 'none' }}
                  >
                    <option value="">Select a coach...</option>
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName}</option>
                    ))}
                  </select>
                </div>
              )}

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
