import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { getMyProfile } from './api';
import { saveToken, clearToken } from './utils/tokenStore';
import { useUser } from './context/UserContext';
import './index.css';

// Lazy-loaded pages — only fetched when navigated to
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));

function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check if token is in the URL (browser OAuth redirect flow)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      saveToken(tokenFromUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const verify = async () => {
      try {
        const profile = await getMyProfile();
        setUser(profile);
      } catch {
        clearToken();
        setUser(null);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    // 2. If running inside Electron, listen for token via IPC — only verify AFTER token is stored
    if (window.electron?.onAuthToken) {
      window.electron.onAuthToken((token) => {
        console.log('App received token from Electron bridge:', token);
        saveToken(token);
        verify();
      });
    }

    // 3. Run verify once (covers: token already in sessionStorage, or token just set from URL)
    verify();

    return () => {
      if (window.electron?.removeAuthListener) {
        window.electron.removeAuthListener();
      }
    };
  }, [navigate, setUser]);

  if (loading) return <div id="welcome"><div className="wc-title">Loading OrkaEval...</div></div>;
  if (!user) return null;

  return children;
}

function App() {
  const loadingFallback = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--clr-text-muted)', fontSize: '1rem' }}>
      Loading…
    </div>
  );

  return (
    <BrowserRouter>
      <Suspense fallback={loadingFallback}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/dashboard" 
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
