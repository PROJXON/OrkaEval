import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { clearToken } from '../utils/tokenStore';
import { getCandidates, submitForm, getFormHistory } from '../api';
import EvaluationContainer from '../components/forms/EvaluationContainer';
import EvaluatorDashboard from '../components/forms/EvaluatorDashboard';
import PerformanceReviewResults from '../components/forms/PerformanceReviewResults';
import AnalyticsHub from '../components/AnalyticsHub';
import Logo from '../components/Logo';

function Dashboard() {
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const getServerUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = (import.meta.env.VITE_API_BASE_URL || 'https://orkaeval.onrender.com/api').replace(/\/api$/, '');
    return `${base}${url}`;
  };

  const userRole = user?.role || user?.Role || 'Candidate';
  const [viewRole, setViewRole] = useState(userRole === 'Both' ? 'Candidate' : userRole);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState('performance_review');
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const cycleInfo = useMemo(() => {
    const programStartDate = "2026-03-01"; // Fixed program start date
    const start = new Date(programStartDate);
    const now = new Date();
    const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    const cycleNum = Math.floor(diffDays / 56) + 1;
    const cycleStart = new Date(start);
    cycleStart.setDate(start.getDate() + (cycleNum - 1) * 56);
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleStart.getDate() + 56);
    
    return {
      start: cycleStart.toLocaleDateString(),
      end: cycleEnd.toLocaleDateString(),
      number: cycleNum
    };
  }, [user?.startDate]);

  const loadCandidates = useCallback(async () => {
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (e) {
      console.error("Failed to load candidates", e);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getFormHistory(selectedCandidateId || undefined);
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, [selectedCandidateId]);

  useEffect(() => {
    if (viewRole === 'Coach' || userRole === 'Both') {
      loadCandidates();
    }
    loadHistory();
  }, [viewRole, userRole, loadCandidates, loadHistory]);

  // Safety Check: If user context is not ready, show a premium loading state
  if (!user) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg)', color: 'var(--clr-text)' }}>
        <Logo size={80} className="anim-pulse" />
        <p style={{ marginTop: 20, fontSize: '1.1rem', fontWeight: 600, opacity: 0.6 }}>Loading OrkaEval...</p>
      </div>
    );
  }

  const handleLogout = () => {
    clearToken();
    window.location.href = '/';
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (viewRole === 'Coach' && !selectedCandidateId) {
      setMsg({ type: 'error', text: 'Please select a team member first.' });
      return;
    }

    setLoading(true);
    try {
      await submitForm({
        candidateId: selectedCandidateId ? parseInt(selectedCandidateId) : null,
        formType: activeForm,
        formData: JSON.stringify(formData)
      });
      setMsg({ type: 'success', text: 'Form submitted successfully!' });
      setFormData({});
      loadHistory();
    } catch (err) {
      setMsg({ type: 'error', text: 'Submission failed. Please try again.' });
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const renderForm = () => {
    if (showEvaluation) {
      const cycleId = user?.currentCycle?.id || 1; 
      
      if (activeForm === 'performance_review' || activeForm === 'evaluator') {
        if (viewRole === 'Coach') {
          return (
            <EvaluatorDashboard 
              cycleId={0} 
              onBack={() => setShowEvaluation(false)} 
              onComplete={() => { setShowEvaluation(false); loadHistory(); }}
            />
          );
        }
        return (
          <EvaluationContainer 
            cycleId={cycleId} 
            program="review" 
            onBack={() => setShowEvaluation(false)} 
            onComplete={() => { setShowEvaluation(false); loadHistory(); }}
          />
        );
      }

      if (activeForm === 'view_results') {
        return (
          <PerformanceReviewResults 
            evaluationId={selectedEvaluationId} 
            onBack={() => setShowEvaluation(false)} 
          />
        );
      }

      const programType = activeForm === 'open_discussion' ? 'discussion' : 
                         activeForm === 'checkin' ? 'checkin' : 'coaching';
      
      return (
        <EvaluationContainer 
          cycleId={cycleId} 
          candidateId={selectedCandidateId}
          program={programType} 
          onBack={() => setShowEvaluation(false)} 
          onComplete={() => { setShowEvaluation(false); loadHistory(); }}
        />
      );
    }

    return (
      <div className="form-selector">
        {viewRole === 'Coach' && (
          <div className="card-glass mb-8" style={{ padding: '24px', border: '1px solid var(--clr-brand-subtle)' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--clr-brand)' }}>
              SELECT TEAM MEMBER TO REVIEW / CONDUCT SESSION
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="fi"
              style={{ maxWidth: '400px' }}
            >
              <option value="">-- Choose a team member --</option>
              {candidates.map(c => (
                <option key={c.id} value={c.id}>{c.fullName}</option>
              ))}
            </select>
            <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '8px' }}>
              Select a candidate first, then choose a session type below.
            </p>
          </div>
        )}
        <div className="form-grid">
          {viewRole === 'Candidate' ? (
            <div className="form-card card-glass active" onClick={() => { setActiveForm('performance_review'); setShowEvaluation(true); }}>
              <div className="form-card__icon">📊</div>
              <h3>Performance Review</h3>
              <p>Self-evaluation for the current cycle</p>
            </div>
          ) : (
            <>
              <div 
                className={`form-card card-glass ${selectedCandidateId ? 'active' : 'disabled'}`} 
                onClick={() => { 
                  if (!selectedCandidateId) return;
                  setActiveForm('open_discussion'); 
                  setShowEvaluation(true); 
                }}
                style={{ cursor: selectedCandidateId ? 'pointer' : 'not-allowed', opacity: selectedCandidateId ? 1 : 0.6 }}
              >
                <div className="form-card__icon">🤝</div>
                <h3>Open Discussion</h3>
                <p>Casual sync or specific topic deep-dive</p>
                {!selectedCandidateId && <span style={{ fontSize: '0.7rem', color: 'var(--clr-re)', fontWeight: 700 }}>SELECT CANDIDATE FIRST</span>}
              </div>
              <div 
                className={`form-card card-glass ${selectedCandidateId ? 'active' : 'disabled'}`} 
                onClick={() => { 
                  if (!selectedCandidateId) return;
                  setActiveForm('checkin'); 
                  setShowEvaluation(true); 
                }}
                style={{ cursor: selectedCandidateId ? 'pointer' : 'not-allowed', opacity: selectedCandidateId ? 1 : 0.6 }}
              >
                <div className="form-card__icon">👋</div>
                <h3>Weekly Check-In</h3>
                <p>Quick pulse check and alignment</p>
                {!selectedCandidateId && <span style={{ fontSize: '0.7rem', color: 'var(--clr-re)', fontWeight: 700 }}>SELECT CANDIDATE FIRST</span>}
              </div>
              <div 
                className={`form-card card-glass ${selectedCandidateId ? 'active' : 'disabled'}`} 
                onClick={() => { 
                  if (!selectedCandidateId) return;
                  setActiveForm('coaching'); 
                  setShowEvaluation(true); 
                }}
                style={{ cursor: selectedCandidateId ? 'pointer' : 'not-allowed', opacity: selectedCandidateId ? 1 : 0.6 }}
              >
                <div className="form-card__icon">🧠</div>
                <h3>Coaching Session</h3>
                <p>Skill development and feedback</p>
                {!selectedCandidateId && <span style={{ fontSize: '0.7rem', color: 'var(--clr-re)', fontWeight: 700 }}>SELECT CANDIDATE FIRST</span>}
              </div>
              <div 
                className={`form-card card-glass ${selectedCandidateId ? 'active' : 'disabled'}`} 
                onClick={() => { 
                  if (!selectedCandidateId) return;
                  setActiveForm('performance_review'); 
                  setShowEvaluation(true); 
                }}
                style={{ cursor: selectedCandidateId ? 'pointer' : 'not-allowed', opacity: selectedCandidateId ? 1 : 0.6 }}
              >
                <div className="form-card__icon">⚖️</div>
                <h3>Team Reviews</h3>
                <p>Review and sign-off on team evaluations</p>
                {!selectedCandidateId && <span style={{ fontSize: '0.7rem', color: 'var(--clr-re)', fontWeight: 700 }}>SELECT CANDIDATE FIRST</span>}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (showAnalytics) {
      return <AnalyticsHub cycleId={cycleInfo.number} onBack={() => setShowAnalytics(false)} />;
    }
    return renderForm();
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <Link to="/dashboard" className="nav-brand" style={{ textDecoration: 'none' }}>
          <Logo size={48} />
        </Link>
        
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {(user?.role === 'Both' || user?.Role === 'Both') && (
            <button 
              className="btn-nav btn-nav--switcher"
              onClick={() => setViewRole(viewRole === 'Candidate' ? 'Coach' : 'Candidate')}
              style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(10,31,61,0.1)', background: 'var(--clr-surface)', color: 'var(--clr-text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '1.2rem' }}>🔄</span>
              Switch to {viewRole === 'Candidate' ? 'Coach' : 'Candidate'}
            </button>
          )}
          {viewRole !== 'Coach' && (
            <button 
              className={`btn-history ${showHistory ? 'active' : ''}`} 
              onClick={() => setShowHistory(!showHistory)}
            >
              🕒 {showHistory ? 'Close History' : 'View History'}
            </button>
          )}
          <button className="theme-toggle" onClick={toggleTheme} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '8px' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div 
            onClick={() => navigate('/profile')} 
            style={{ width: 44, height: 44, borderRadius: '14px', overflow: 'hidden', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            {user?.avatarUrl ? (
              <img 
                src={getServerUrl(user.avatarUrl)} 
                alt="" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : <span style={{ fontSize: '1.2rem' }}>👤</span>}
          </div>
        </div>
      </nav>

      <main className="dashboard-main anim-fade-in">
        <header className="content-header" style={{ marginBottom: '48px' }}>
          <div className="profile-info" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h1 style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '20px' }}>
              Welcome back, <span style={{ color: 'var(--clr-azure)' }}>
                {viewRole === 'Coach' ? `Coach ${user?.displayName}` : user?.displayName}
              </span>
            </h1>
            <div className="profile-stats" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span className="stat-tag" style={{ background: 'var(--clr-border)', color: 'var(--clr-text-muted)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 }}>
                {viewRole === 'Coach' ? 'Active Program Cycle' : `Cycle ${cycleInfo.number}`}: {cycleInfo.start} - {cycleInfo.end}
              </span>
              {viewRole === 'Coach' && !showAnalytics && (
                <button 
                  className="btn btn-brand btn-s" 
                  onClick={() => setShowAnalytics(true)}
                  style={{ borderRadius: '100px', padding: '6px 20px' }}
                >
                  Insights Hub 📊
                </button>
              )}
            </div>
          </div>
        </header>

        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <div className={`dashboard-grid ${showHistory ? 'with-history' : ''}`}>
          {/* Left Column: Form Space */}
          <section className="form-section">
            {renderContent()}
          </section>

          {/* Right Column: History Panel */}
          {showHistory && (
            <aside className="history-panel card-glass anim-slide-in-right">
              <div className="panel-hdr">
                <h3>Submission History</h3>
                <button className="btn-close" onClick={() => setShowHistory(false)}>×</button>
              </div>
              <div className="history-list">
                {history.length === 0 ? (
                  <p className="empty-msg">No submissions found.</p>
                ) : (
                  history.map(item => (
                    <div key={item.id} className="history-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                      <div className="item-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--clr-text)' }}>
                          {(item.formType || item.FormType || '').replace('_', ' ').toUpperCase()}
                        </strong>
                        {item.status && (
                          <span className={`status-tag ${(item.status || '').toLowerCase().replace(' ', '-')}`} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px' }}>
                            {(item.status === 'Submitted' || item.status === 'SelfCompleted') ? 'Submitted' : 
                             item.status === 'EvaluatorCompleted' ? 'Evaluated' : 
                             item.status === 'SessionCompleted' ? 'Finalized' : item.status}
                          </span>
                        )}
                      </div>
                      
                      <div className="item-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--clr-text-muted)' }}>
                        <span>{new Date(item.submittedAt || item.SubmittedAt).toLocaleDateString()}</span>
                        <span className="cycle-label" style={{ background: 'rgba(var(--clr-brand-rgb), 0.1)', color: 'var(--clr-brand)', padding: '0 6px', borderRadius: '4px' }}>
                          Cycle {item.cycleNumber || item.CycleNumber || '?'}
                        </span>
                      </div>

                      {item.isEvaluation && (
                        <button 
                          className="btn btn-brand btn-s" 
                          style={{ width: '100%', marginTop: '4px', fontSize: '12px', padding: '8px' }}
                          onClick={() => {
                            setSelectedEvaluationId(item.id);
                            setActiveForm('view_results');
                            setShowEvaluation(true);
                          }}
                        >
                          View Results →
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
