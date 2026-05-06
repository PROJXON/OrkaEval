import { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
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
    // 1. Check if token is in the URL (support both normal and HashRouter URLs)
    const getParam = (name) => {
      const search = new URLSearchParams(window.location.search).get(name);
      if (search) return search;
      // If not in search, check the hash (for HashRouter)
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        return new URLSearchParams(hashParts[1]).get(name);
      }
      return null;
    };

    const tokenFromUrl = getParam('token');
    if (tokenFromUrl) {
      saveToken(tokenFromUrl);
      // Clean up URL
      const cleanPath = window.location.pathname + window.location.hash.split('?')[0];
      window.history.replaceState({}, document.title, cleanPath);
    }

    const verify = async () => {
      try {
        const profile = await getMyProfile();
        setUser(profile);
      } catch (err) {
        console.error("Verification failed:", err);
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
    <HashRouter>
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
    </HashRouter>
  );
}

export default App;
