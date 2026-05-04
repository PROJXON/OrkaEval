import { useState, useEffect } from 'react';
import { getEvaluationById } from '../../api';
import { handleApiError } from '../../utils/errorHandler';
import { Skeleton } from '../ui/Skeleton';

function PerformanceReviewResults({ evaluationId, onBack }) {
    const [evalData, setEvalData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getEvaluationById(evaluationId);
                setEvalData(data);
            } catch (e) {
                handleApiError(e, 'Failed to fetch evaluation results');
            } finally {
                setLoading(false);
            }
        };
        if (evaluationId) fetchData();
    }, [evaluationId]);

    const competencies = [
        { key: 'technicalSkills', label: 'Technical Skills' },
        { key: 'communication', label: 'Communication & Collaboration' },
        { key: 'leadership', label: 'Leadership & Initiative' },
        { key: 'growthLearning', label: 'Growth & Learning' },
        { key: 'culture', label: 'Culture & Professional Growth' },
    ];

    if (loading) return (
        <div className="loader-c" style={{padding:'40px'}}>
            <Skeleton width="100%" height="32px" />
            <Skeleton width="100%" height="200px" style={{marginTop:'20px'}} />
        </div>
    );

    if (!evalData) return (
        <div className="empty-state" style={{padding:'60px', textAlign:'center'}}>
            <div style={{fontSize:'48px', marginBottom:'20px'}}>🔍</div>
            <h2>No evaluation data found.</h2>
            <p>We couldn't retrieve the details for this evaluation cycle.</p>
            <button className="btn btn-brand mt-8" onClick={onBack}>Return to Dashboard</button>
        </div>
    );

    return (
        <div className="eval-results-view anim-fade-in" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <div className="card-hdr-flex" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--clr-text)' }}>
                    Performance Review Results: Cycle {evalData.cycleNumber || '?'}
                </h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-brand" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        📄 Download PDF
                    </button>
                    <button className="btn btn-ghost" onClick={onBack}>← Back</button>
                </div>
            </div>

            <div className="results-grid" style={{ display: 'grid', gap: '24px' }}>
                {/* Comparison Summary */}
                <div className="eval-card card-glass">
                    <div className="card-hdr"><h3>Ratings Comparison</h3></div>
                    <div className="card-body">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--clr-pri)', color: '#fff' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Competency</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Your Rating</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Coach Rating</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Alignment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {competencies.map(c => {
                                        const self = evalData.competencies?.[c.key]?.selfRating;
                                        const coach = evalData.competencies?.[c.key]?.evaluatorRating;
                                        const delta = (self && coach) ? coach - self : null;
                                        return (
                                            <tr key={c.key} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                                                <td style={{ padding: '12px' }}><strong>{c.label}</strong></td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>{self ?? '—'}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: 'var(--clr-brand)' }}>{coach ?? '—'}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {delta === null ? '—' : delta === 0 ? '✅ Aligned' : delta > 0 ? <span style={{color:'var(--clr-success)'}}>+{delta} ▲</span> : <span style={{color:'var(--clr-danger)'}}>{delta} ▼</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Detailed Feedback */}
                <div className="feedback-sections">
                    <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 600 }}>Detailed Feedback</h3>
                    {competencies.map(c => (
                        <div key={c.key} className="eval-card mb-4" style={{ marginBottom: '16px', borderLeft: '4px solid var(--clr-brand)' }}>
                            <div className="card-hdr" style={{ padding: '12px 20px', background: 'rgba(var(--clr-brand-rgb), 0.05)' }}>
                                <strong>{c.label}</strong>
                            </div>
                            <div className="card-body" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Your Evidence</label>
                                    <p style={{ marginTop: '8px', fontSize: '14px' }}>{evalData.competencies?.[c.key]?.selfEvidence || 'No evidence provided.'}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Coach Observations</label>
                                    <p style={{ marginTop: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--clr-brand)' }}>
                                        {evalData.competencies?.[c.key]?.evaluatorNotes || 'No notes provided yet.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reflection */}
                <div className="eval-card card-glass">
                    <div className="card-hdr"><h3>Self-Reflection</h3></div>
                    <div className="card-body">
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontWeight: 600 }}>Greatest Achievement:</label>
                            <p style={{ marginTop: '4px' }}>{evalData.reflection?.greatestAchievement || '—'}</p>
                        </div>
                        <div>
                            <label style={{ fontWeight: 600 }}>Goals for next cycle:</label>
                            <p style={{ marginTop: '4px' }}>{evalData.reflection?.goal1 || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <button className="btn btn-brand" onClick={onBack}>Close Results</button>
            </div>
        </div>
    );
}

export default PerformanceReviewResults;
