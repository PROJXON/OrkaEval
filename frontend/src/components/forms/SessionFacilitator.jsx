import { useState, useEffect, useRef, useCallback } from 'react';
import CheckIn from './CheckIn';
import Coaching from './Coaching';

const SESSION_CONFIGS = {
  discussion: {
    totalTime: 1800, // 30 mins
    title: 'Open Discussion',
    icon: '💬',
    description: 'Alignment conversation for both parties.',
    phases: [
      { id: 1, name: 'Ice Breaker', dur: 120, icon: '🎲', color: 'var(--pu)' },
      { id: 2, name: 'Updates', dur: 300, icon: '📣', color: 'var(--cy)', field: 'topOfMind', prompt: 'Focus on recent progress, wins, and current status of active projects.' },
      { id: 3, name: 'Issue Resolution', dur: 1200, icon: '🚧', color: 'var(--or)', field: 'notes', prompt: 'Deep dive into blockers, support needed, and resource planning.' },
      { id: 4, name: 'Recap + Next Steps', dur: 180, icon: '🎬', color: 'var(--re)', field: 'takeaway', prompt: 'Summarize immediate next steps and confirm clarity on actions.' }
    ]
  },
  checkin: {
    totalTime: 1800, // 30 mins
    title: 'Weekly Check-In',
    icon: '✅',
    description: 'Quick pulse check and blocker resolution.',
    phases: [
      { id: 1, name: 'Pulse Check', dur: 120, icon: '🍃', color: 'var(--pu)' },
      { id: 2, name: 'Attendance & Log', dur: 300, icon: '📋', color: 'var(--cy)' },
      { id: 3, name: 'Participant-Led Topics', dur: 1200, icon: '🎯', color: 'var(--or)' },
      { id: 4, name: 'Session Closing', dur: 180, icon: '🎬', color: 'var(--re)' }
    ]
  },
  coaching: {
    totalTime: 2700, // 45 mins
    title: 'Monthly Coaching',
    icon: '🎯',
    description: 'A focused 45-minute session to reflect, realign, and connect your goals to your work.',
    phases: [
      { id: 1, name: 'Pulse Check', dur: 600, icon: '🌊', color: 'var(--pu)' },
      { id: 2, name: 'Deep Coaching', dur: 1800, icon: '🔎', color: 'var(--or)' },
      { id: 3, name: 'Session Closing', dur: 300, icon: '🏁', color: 'var(--re)' }
    ]
  }
};

const ICE_BREAKERS = [
  { i: '💡', q: "What is one small win you've had recently?" },
  { i: '🌱', q: "What is something you are proud of this week?" },
  { i: '🚀', q: "What has been going better than expected lately?" },
  { i: '🤔', q: "What is one thing you learned recently that surprised you?" },
  { i: '🔥', q: "What is something that has helped you stay motivated?" }
];

function SessionFacilitator({ data, onChange, type = 'discussion' }) {
  const config = SESSION_CONFIGS[type] || SESSION_CONFIGS.discussion;
  const phases = config.phases;

  const [activePhase, setActivePhase] = useState(-1); // -1: Not started
  const [timeLeft, setTimeLeft] = useState(config.totalTime);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [iceBreaker, setIceBreaker] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => Math.max(0, t - 1));
        setPhaseTimeLeft(pt => Math.max(0, pt - 1));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const startSession = () => {
    setIceBreaker(ICE_BREAKERS[Math.floor(Math.random() * ICE_BREAKERS.length)]);
    setActivePhase(0);
    setPhaseTimeLeft(phases[0].dur);
    setIsRunning(true);
  };

  const handleNextPhase = useCallback(() => {
    const next = activePhase + 1;
    if (next < phases.length) {
      setActivePhase(next);
      setPhaseTimeLeft(phases[next].dur);
    } else {
      setIsRunning(false);
    }
  }, [activePhase, phases]);

  useEffect(() => {
    if (phaseTimeLeft === 0 && isRunning && activePhase < phases.length - 1) {
      const timer = setTimeout(() => handleNextPhase(), 0);
      return () => clearTimeout(timer);
    } else if (phaseTimeLeft === 0 && isRunning && activePhase === phases.length - 1) {
      const timer = setTimeout(() => setIsRunning(false), 0);
      console.info("Session Complete! All phases finalized.");
      return () => clearTimeout(timer);
    }
  }, [phaseTimeLeft, isRunning, activePhase, phases.length, handleNextPhase]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const progress = ((config.totalTime - timeLeft) / config.totalTime) * 100;

  return (
    <div className="session-facilitator anim-fade-in">
      <div className="facilitator-hud">
        <div className="hud-metric">
          <span className="hud-lbl">TOTAL TIME</span>
          <span className={`hud-val ${timeLeft < 60 ? 'txt-re anim-pulse' : ''}`}>{formatTime(timeLeft)}</span>
        </div>
        <div className="hud-progress-rail">
          <div className="hud-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="hud-btns">
          {!isRunning && activePhase === -1 ? (
            <button className="btn btn-brand btn-glow" onClick={startSession}>▶ Start Session</button>
          ) : (
            <button className="btn btn-ghost" onClick={() => setIsRunning(!isRunning)}>
              {isRunning ? '⏸ Pause' : '▶ Resume'}
            </button>
          )}
          <button className="btn btn-brand" disabled={activePhase === -1 || activePhase === phases.length - 1} onClick={handleNextPhase}>
            Next Phase →
          </button>
        </div>
      </div>

      <div className="facilitator-main mt-6">
        {activePhase === -1 ? (
          <div className="empty-state">
            <div className="empty-ico">{config.icon}</div>
            <h3>Ready for your {config.title}?</h3>
            <p>{config.description}</p>
          </div>
        ) : (
          <div className="phase-card">
            <div className="phase-hdr" style={{ borderTop: `4px solid ${phases[activePhase].color}` }}>
              <div className="phase-meta">
                <span className="ph-num">PHASE 0{activePhase + 1}</span>
                <span className="ph-timer" style={{ color: phases[activePhase].color }}>{formatTime(phaseTimeLeft)}</span>
              </div>
              <div className="ph-title-row">
                <span className="ph-ico">{phases[activePhase].icon}</span>
                <h2>{phases[activePhase].name}</h2>
              </div>
            </div>

            <div className="phase-body">
              {(activePhase === 0) && (
                <div className="ice-breaker-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <span className="ib-ico">{iceBreaker?.i}</span>
                    <button
                      className="btn-ghost"
                      onClick={() => setIceBreaker(ICE_BREAKERS[Math.floor(Math.random() * ICE_BREAKERS.length)])}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', fontSize: '0.72rem', fontWeight: 600,
                        borderRadius: '20px', border: '1px solid var(--clr-border)',
                        background: 'var(--clr-surface-2)', color: 'var(--clr-text-muted)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        letterSpacing: '0.02em'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--clr-brand)'; e.currentTarget.style.borderColor = 'var(--clr-brand)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--clr-text-muted)'; e.currentTarget.style.borderColor = 'var(--clr-border)'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
                      </svg>
                      Shuffle
                    </button>
                  </div>
                  <p className="ib-q">{iceBreaker?.q}</p>
                  <p className="ib-sub">Use this time to settle in and set a positive tone.</p>
                </div>
              )}

              {/* Standalone Program Forms */}
              {type === 'checkin' && activePhase >= 0 && (
                <div className="standalone-form-wrap mt-4">
                  <CheckIn data={data} onChange={onChange} activePhase={activePhase} />
                </div>
              )}

              {type === 'coaching' && activePhase >= 0 && (
                <div className="standalone-form-wrap mt-4">
                  <Coaching data={data} onChange={onChange} activePhase={activePhase} />
                </div>
              )}

              {type === 'discussion' && phases[activePhase].field && (
                <div className="phase-content anim-slide-up">
                  <p>{phases[activePhase].prompt}</p>
                  <textarea
                    className="f-input mt-4"
                    placeholder="Write your session notes here..."
                    style={{ minHeight: '150px' }}
                    value={data[phases[activePhase].field] || ''}
                    onChange={(e) => onChange({ ...data, [phases[activePhase].field]: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="facilitator-grid mt-6">
        {phases.map((p, idx) => (
          <div
            key={p.id}
            className={`ph-grid-item ${activePhase === idx ? 'active' : ''} ${activePhase > idx ? 'done' : ''}`}
            onClick={() => activePhase !== -1 && setActivePhase(idx)}
            style={{ cursor: activePhase === -1 ? 'default' : 'pointer' }}
          >
            <div className="pg-hdr">
              <span>Phase {p.id}</span>
              <span>{formatTime(p.dur)}</span>
            </div>
            <div className="pg-nm">{p.name}</div>
            <div className="pg-status">{activePhase === idx ? 'IN PROGRESS' : activePhase > idx ? '✓ DONE' : 'WAITING'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SessionFacilitator;
