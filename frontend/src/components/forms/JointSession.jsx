import React, { useState, useEffect } from 'react';
import { getTeamEvaluations, completeEvaluation } from '../../api';
import api from '../../api'; // import the axios instance for session save
import toast from 'react-hot-toast';
import { handleApiError } from '../../utils/errorHandler';

function JointSession({ cycleId, onBack }) {
    const [evals, setEvals] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finalized, setFinalized] = useState(false);
    const [sessionNotes, setSessionNotes] = useState({
        sessionFormat: 'virtual',
        icebreakerTeamMember: '',
        icebreakerEvaluator: '',
        actionPlanGoal1: '',
        actionPlanGoal2: '',
        actionPlanGoal3: '',
        actionPlanDates: '',
        agreedGoals: '',
        keyTakeaways: '',
        nextSteps: '',
        sessionRating: 5,
    });

    useEffect(() => {
        const fetchEvals = async () => {
            try {
                const responseData = await getTeamEvaluations(cycleId);
                const data = responseData?.items ?? responseData ?? [];
                setEvals(data);
                // Auto-select first eval that is evaluator-completed
                const ready = data.find(e => e.status === 'EvaluatorCompleted' || e.status === 3 || e.status === 'SessionCompleted' || e.status === 4);
                if (ready) setSelected(ready);
                if (ready?.status === 'SessionCompleted' || ready?.status === 3) setFinalized(true);
            } catch (e) {
                handleApiError(e, 'Failed to fetch evaluations');
            } finally {
                setLoading(false);
            }
        };
        fetchEvals();
    }, [cycleId]);

    const handleFinalize = async () => {
        if (!selected) return;
        try {
            // Save session notes first
            await api.put(`/evaluations/${selected.id}/session`, sessionNotes);
            // Then mark complete
            await completeEvaluation(selected.id);
            setFinalized(true);
            toast.success('Session finalized successfully');
        } catch (e) {
            handleApiError(e, 'Error finalizing session');
        }
    };

    const competencies = [
        { key: 'technicalSkills', label: 'Technical Skills' },
        { key: 'communication', label: 'Communication & Collaboration' },
        { key: 'leadership', label: 'Leadership & Initiative' },
        { key: 'growthLearning', label: 'Growth & Learning' },
        { key: 'culture', label: 'Culture & Professional Growth' },
    ];

    if (loading) return <div className="loader-c">Initializing Secure Session...</div>;
    if (finalized) return (
        <div className="empty-state" style={{textAlign:'center',padding:'60px'}}>
            <div style={{fontSize:'64px',marginBottom:'16px'}}>🎉</div>
            <h2>Session Complete!</h2>
            <p>Evaluation cycle Q{cycleId} has been finalized.</p>
            <button className="btn btn-brand mt-8" onClick={onBack}>Return to Dashboard</button>
        </div>
    );

    if (!selected) return (
        <div className="evaluator-hub anim-fade-in">
            <div className="card-hdr-flex">
                <h2>Joint Session — Select Evaluation</h2>
                <button className="btn btn-ghost" onClick={onBack}>Exit</button>
            </div>
            {evals.length === 0 ? (
                <div className="empty-state">No evaluations ready for joint session.</div>
            ) : (
                <div className="eval-list">
                    {evals.map(e => (
                        <div key={e.id} className="eval-row" style={{cursor:'pointer',padding:'16px',border:'1px solid var(--clr-border)',borderRadius:'8px',marginBottom:'8px', background: 'var(--clr-card-bg)'}} onClick={() => setSelected(e)}>
                            <strong>{e.user?.displayName || 'Unknown'}</strong> — Status: {e.status} — Q{e.cycleId} Review
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="joint-session anim-fade-in">
            <div className="card-hdr-flex">
                <div className="session-title">
                    <span className="live-indicator">LIVE</span>
                    <h2>Joint Review: {selected.user?.displayName}</h2>
                </div>
                <button className="btn btn-ghost" onClick={onBack}>Exit Session</button>
            </div>

            {/* FORMAT PICKER */}
            <div className="eval-card mb-8">
                <div className="card-hdr"><h3>Session Format</h3></div>
                <div className="card-body" style={{display:'flex',gap:'12px'}}>
                    {['in-person','hybrid','virtual'].map(f => (
                        <button key={f} className={`btn ${sessionNotes.sessionFormat === f ? 'btn-brand' : 'btn-ghost'}`} onClick={() => setSessionNotes(p => ({...p, sessionFormat: f}))}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* ICEBREAKER */}
            <div className="eval-card mb-8">
                <div className="card-hdr"><h3>Icebreaker</h3></div>
                <div className="card-body">
                    <div className="form-group">
                        <label>How is {selected.user?.displayName} feeling this week?</label>
                        <textarea className="fi" value={sessionNotes.icebreakerTeamMember} onChange={e => setSessionNotes(p => ({...p, icebreakerTeamMember: e.target.value}))} />
                    </div>
                    <div className="form-group">
                        <label>How is the evaluator feeling?</label>
                        <textarea className="fi" value={sessionNotes.icebreakerEvaluator} onChange={e => setSessionNotes(p => ({...p, icebreakerEvaluator: e.target.value}))} />
                    </div>
                </div>
            </div>

            {/* COMPARISON TABLE */}
            <div className="eval-card mb-8">
                <div className="card-hdr"><h3>Ratings Comparison</h3></div>
                <div className="card-body">
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                        <thead>
                            <tr style={{background:'var(--clr-pri)',color:'#fff'}}>
                                <th style={{padding:'10px 14px',textAlign:'left'}}>Competency</th>
                                <th style={{padding:'10px 14px',textAlign:'center'}}>Self</th>
                                <th style={{padding:'10px 14px',textAlign:'center'}}>Coach</th>
                                <th style={{padding:'10px 14px',textAlign:'center'}}>Delta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {competencies.map(c => {
                                const self = selected.competencies?.[c.key]?.selfRating;
                                const coach = selected.competencies?.[c.key]?.evaluatorRating;
                                const delta = (self && coach) ? coach - self : null;
                                return (
                                    <tr key={c.key} style={{borderBottom:'1px solid var(--clr-border)'}}>
                                        <td style={{padding:'10px 14px'}}>{c.label}</td>
                                        <td style={{padding:'10px 14px',textAlign:'center',fontWeight:700}}>{self ?? '—'}</td>
                                        <td style={{padding:'10px 14px',textAlign:'center',fontWeight:700,color:'var(--clr-brand)'}}>{coach ?? '—'}</td>
                                        <td style={{padding:'10px 14px',textAlign:'center'}}>
                                            {delta === null ? '—' : delta === 0 ? '✅ Aligned' : delta > 0 ? `+${delta} ▲` : `${delta} ▼`}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ACTION PLAN */}
            <div className="eval-card mb-8">
                <div className="card-hdr"><h3>Action Plan & Goals</h3></div>
                <div className="card-body">
                    {['actionPlanGoal1','actionPlanGoal2','actionPlanGoal3'].map((g, i) => (
                        <div className="form-group" key={g}>
                            <label>Goal {i + 1}</label>
                            <input className="fi" value={sessionNotes[g]} onChange={e => setSessionNotes(p => ({...p, [g]: e.target.value}))} placeholder={`Goal ${i + 1}`} />
                        </div>
                    ))}
                    <div className="form-group">
                        <label>Target Dates</label>
                        <input className="fi" value={sessionNotes.actionPlanDates} onChange={e => setSessionNotes(p => ({...p, actionPlanDates: e.target.value}))} />
                    </div>
                    <div className="form-group">
                        <label>Agreed Upon Goals for Cycle</label>
                        <textarea className="fi" value={sessionNotes.agreedGoals} onChange={e => setSessionNotes(p => ({...p, agreedGoals: e.target.value}))} />
                    </div>
                </div>
            </div>

            {/* TAKEAWAYS */}
            <div className="eval-card mb-8">
                <div className="card-hdr"><h3>Key Takeaways & Next Steps</h3></div>
                <div className="card-body">
                    <div className="form-group">
                        <label>Key Takeaways from this Session</label>
                        <textarea className="fi" value={sessionNotes.keyTakeaways} onChange={e => setSessionNotes(p => ({...p, keyTakeaways: e.target.value}))} />
                    </div>
                    <div className="form-group">
                        <label>Next Steps</label>
                        <textarea className="fi" value={sessionNotes.nextSteps} onChange={e => setSessionNotes(p => ({...p, nextSteps: e.target.value}))} />
                    </div>
                    <div className="form-group">
                        <label>Session Rating (1–10)</label>
                        <input type="range" min="1" max="10" value={sessionNotes.sessionRating} onChange={e => setSessionNotes(p => ({...p, sessionRating: parseInt(e.target.value)}))} style={{width:'100%'}} />
                        <div style={{textAlign:'center',fontWeight:700,fontSize:'20px'}}>{sessionNotes.sessionRating}</div>
                    </div>
                </div>
            </div>

            {/* FINALIZE */}
            <div style={{display:'flex',justifyContent:'flex-end',padding:'16px 0'}}>
                <button className="btn btn-brand btn-lg" onClick={handleFinalize}>
                    ✅ Complete & Sign Off
                </button>
            </div>
        </div>
    );
}

export default JointSession;
