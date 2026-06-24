import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { clearToken } from '../utils/tokenStore';
import api from '../api';
import toast from 'react-hot-toast';
import CoachSearchDropdown from '../components/CoachSearchDropdown';

export default function Profile() {
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    notificationsEnabled: user?.notificationsEnabled ?? true
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
    const base = (import.meta.env.VITE_API_BASE_URL || 'https://orkaeval-2fbm.onrender.com/api').replace(/\/api$/, '');
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
      const response = await api.put('/auth/profile', { 
        displayName: formData.displayName,
        notificationsEnabled: formData.notificationsEnabled
      });
      setUser(prev => ({ ...prev, ...response.data }));
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

  const formatDateSafe = (isoString) => {
    if (!isoString) return '';
    const [year, month, day] = isoString.split('T')[0].split('-');
    return new Date(year, month - 1, day).toLocaleDateString();
  };

  const resolvedCoachId = user?.coachId ?? user?.candidateData?.CoachId ?? '';

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    startDate: user?.startDate ? user.startDate.split('T')[0] : '',
    coachId: resolvedCoachId
  });

  useEffect(() => {
    setAccountFormData({
      startDate: user?.startDate ? user.startDate.split('T')[0] : '',
      coachId: user?.coachId ?? user?.candidateData?.CoachId ?? ''
    });
  }, [user]);

  const handleAccountUpdate = async () => {
    setLoading(true);
    try {
      if (accountFormData.startDate !== (user?.startDate ? user.startDate.split('T')[0] : '')) {
         await api.put('/auth/profile', { startDate: new Date(accountFormData.startDate).toISOString() });
      }
      
      if (String(accountFormData.coachId) !== String(user?.coachId ?? user?.candidateData?.CoachId ?? '')) {
         const cid = accountFormData.coachId === "" ? null : parseInt(accountFormData.coachId);
         await api.put('/auth/profile/coach', { coachId: cid });
      }

      const res = await api.get('/auth/me');
      setUser(res.data);
      
      toast.success('Account information updated');
      setIsEditingAccount(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account information');
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
          <button className="theme-switch" onClick={toggleTheme} aria-label="Toggle theme">
            <div className="theme-switch-thumb">
              {theme === 'dark' ? '🌙' : '☀️'}
            </div>
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

          {/* Account Information Section */}
          <div className="card-glass" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Account Information</h3>
              {!isEditingAccount ? (
                <button 
                  onClick={() => setIsEditingAccount(true)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)' }}
                  title="Edit Account Information"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                </button>
              ) : null}
            </div>

            {isEditingAccount ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Email</label>
                  <input type="text" value={user?.email || ''} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface)', color: 'var(--clr-text-muted)', fontSize: '1rem', cursor: 'not-allowed' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Start Date</label>
                  <input 
                    type="date" 
                    value={accountFormData.startDate} 
                    onChange={e => setAccountFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', color: 'var(--clr-text)', fontSize: '1rem' }} 
                  />
                </div>
                {user?.role !== 'Coach' && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Assigned Coach</label>
                    <CoachSearchDropdown
                      coaches={coaches.filter(c => c.userId !== user?.id)}
                      value={accountFormData.coachId}
                      onChange={val => setAccountFormData(prev => ({ ...prev, coachId: val }))}
                      placeholder="Select a coach..."
                      disabled={loading}
                    />
                  </div>
                )}
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 12 }}>
                  <button 
                    onClick={handleAccountUpdate}
                    disabled={loading}
                    style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--clr-brand)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingAccount(false);
                      setAccountFormData({
                        startDate: user?.startDate ? user.startDate.split('T')[0] : '',
                        coachId: user?.coachId ?? user?.candidateData?.CoachId ?? ''
                      });
                    }}
                    disabled={loading}
                    style={{ padding: '10px 24px', borderRadius: 8, background: 'transparent', color: 'var(--clr-text)', border: '1px solid var(--clr-border)', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Email</label>
                  <div style={{ fontWeight: 600 }}>{user?.email}</div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Start Date</label>
                  <div style={{ fontWeight: 600 }}>{formatDateSafe(user?.startDate)}</div>
                </div>
                {user?.role !== 'Coach' && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 4 }}>Assigned Coach</label>
                    <div style={{ fontWeight: 600 }}>{user?.coachName || 'None'}</div>
                  </div>
                )}
              </div>
            )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                <input 
                  type="checkbox" 
                  id="notifToggle"
                  checked={formData.notificationsEnabled}
                  onChange={e => setFormData({ ...formData, notificationsEnabled: e.target.checked })}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <label htmlFor="notifToggle" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                  Enable session notifications
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                    Receive alerts when your coach submits a record for you
                  </span>
                </label>
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
