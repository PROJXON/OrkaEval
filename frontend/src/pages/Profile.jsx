import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { clearToken } from '../utils/tokenStore';
import api from '../api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null);
  const [coaches, setCoaches] = useState([]);

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

  const getServerUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = (import.meta.env.VITE_API_BASE_URL || 'https://orkaeval.onrender.com/api').replace(/\/api$/, '');
    return `${base}${url}`;
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLogout = () => {
    clearToken();
    window.location.href = '/';
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/profile', { displayName: formData.displayName });
      setUser(prev => ({ ...prev, displayName: formData.displayName }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB.');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('file', file);

    setLoading(true);
    try {
      const res = await api.post('/auth/profile/avatar', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrl = getServerUrl(res.data.avatarUrl);
      setAvatarPreview(newUrl);
      setUser(prev => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error('Failed to upload picture');
    } finally {
      setLoading(false);
    }
  };

  const handleCoachChange = async (coachId) => {
    setLoading(true);
    try {
      const cid = coachId === "" ? null : parseInt(coachId);
      const res = await api.put('/auth/profile/coach', { coachId: cid });
      setUser(prev => ({ ...prev, coachId: res.data.coachId, coachName: res.data.coachName }));
      toast.success('Coach updated successfully');
    } catch (err) {
      toast.error('Failed to update coach');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <img src="/assets/orkaeval-logo.png" alt="Logo" />
          <span>OrkaEval</span>
        </div>
        
        <div className="nav-actions">
          <button className="btn-nav" onClick={() => navigate('/dashboard')}>
            <span className="btn-nav__icon">🏠</span>
            <span className="btn-nav__text">Dashboard</span>
          </button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      <main className="dashboard-content" style={{ maxWidth: 800, margin: '0 auto', paddingTop: 40 }}>
        <header className="content-header">
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Profile Settings</h1>
          <p style={{ color: 'var(--clr-text-muted)' }}>Manage your account details and security</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Avatar Section */}
          <div className="card-glass" style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', background: 'var(--clr-surface-2)', border: '2px solid var(--clr-brand)' }}>
              {avatarPreview ? (
                <img 
                  src={getServerUrl(avatarPreview)} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div style={{ width: '100%', height: '100%', display: avatarPreview ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', background: 'var(--clr-surface-2)', color: 'var(--clr-text-muted)' }}>
                {user?.displayName?.charAt(0).toUpperCase() || '👤'}
              </div>
              {loading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  ...
                </div>
              )}
            </div>
            <div>
              <h3 style={{ marginBottom: 8, fontSize: '1.2rem' }}>{user?.displayName}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 16 }}>Max 2MB</p>
              <label className="btn btn-brand" style={{ display: 'inline-block', cursor: 'pointer', padding: '8px 16px', fontSize: '0.9rem' }}>
                {user?.avatarUrl ? 'Change Profile' : 'Upload Picture'}
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={loading} />
              </label>
            </div>
          </div>

          {/* Coach Selection Section */}
          {(user?.role === 'Candidate' || user?.role === 'Both' || user?.Role === 'Both') && (
            <div className="card-glass" style={{ padding: 32 }}>
              <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>Your Coach</h3>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Select or Change Coach</label>
                <select
                  value={user?.coachId || ''}
                  onChange={(e) => handleCoachChange(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', color: 'var(--clr-text)', fontSize: '1rem' }}
                >
                  <option value="">Select a coach...</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: 8 }}>
                  Your coach will be able to review your performance and provide feedback.
                </p>
              </div>
            </div>
          )}

          {/* Read-Only Info */}
          <div className="card-glass" style={{ padding: 32 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>Account Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Email</label>
                <div style={{ fontWeight: 600 }}>{user?.email}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Start Date</label>
                <div style={{ fontWeight: 600 }}>{new Date(user?.startDate).toLocaleDateString()}</div>
              </div>
              {user?.coachName && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Assigned Coach</label>
                  <div style={{ fontWeight: 600 }}>{user.coachName}</div>
                </div>
              )}
            </div>
          </div>

          {/* Update Profile */}
          <div className="card-glass" style={{ padding: 32 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>Edit Profile</h3>
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Display Name</label>
                <input 
                  type="text" 
                  value={formData.displayName}
                  onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', color: 'var(--clr-text)', fontSize: '1rem' }}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: 8, background: 'var(--clr-brand)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Update Password */}
          <div className="card-glass" style={{ padding: 32 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.2rem' }}>Change Password</h3>
            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Current Password</label>
                <input 
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', color: 'var(--clr-text)', fontSize: '1rem' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>New Password</label>
                <input 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', color: 'var(--clr-text)', fontSize: '1rem' }}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', color: 'var(--clr-text)', fontSize: '1rem' }}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: 8, background: 'var(--clr-brand)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Danger Zone / Logout */}
          <div className="card-glass" style={{ padding: 32, border: '1px solid rgba(255, 0, 0, 0.1)', background: 'rgba(255, 0, 0, 0.02)' }}>
            <h3 style={{ marginBottom: 12, fontSize: '1.2rem', color: '#ff4d4d' }}>Account Actions</h3>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>Sign out of your session on this device.</p>
            <button 
              onClick={handleLogout}
              className="btn btn-logout"
              style={{ padding: '12px 24px', borderRadius: 8, background: '#ff4d4d', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
