import { useState, useEffect, useCallback } from 'react';
import { getTeamEvaluations, saveEvaluatorReview } from '../../api';
import toast from 'react-hot-toast';
import { handleApiError } from '../../utils/errorHandler';
import { Skeleton } from '../ui/Skeleton';

const COMPETENCIES = [
    { key: 'onlyTechnicalSkills',  label: 'Technical Skills',               selfKey: 'technicalSkills' },
    { key: 'onlyCommunication',    label: 'Communication & Collaboration',   selfKey: 'communication' },
    { key: 'onlyLeadership',       label: 'Leadership & Initiative',         selfKey: 'leadership' },
    { key: 'onlyGrowthLearning',   label: 'Growth & Learning',               selfKey: 'growthLearning' },
    { key: 'onlyCulture',          label: 'Culture & Professional Growth',   selfKey: 'culture' },
];

const PAGE_SIZE = 20;

function EvaluatorDashboard({ cycleId, onBack, onComplete }) {
    const [evals, setEvals]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [selected, setSelected]     = useState(null);
    const [coachRatings, setCoachRatings] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Pagination state
    const [page, setPage]             = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [search, setSearch]         = useState('');
    const [searchInput, setSearchInput] = useState('');

    const fetchTeam = useCallback(async (currentPage = page, currentSearch = search) => {
        setLoading(true);
        try {
            const data = await getTeamEvaluations(cycleId, {
                page: currentPage,
                pageSize: PAGE_SIZE,
                search: currentSearch,
            });
            setEvals(data.items ?? []);
            setTotalPages(data.totalPages ?? 1);
            setTotalCount(data.totalCount ?? 0);
        } catch (e) {
            handleApiError(e, 'Failed to fetch team evaluations');
        } finally {
            setLoading(false);
        }
    }, [cycleId, page, search]);

    useEffect(() => {
        fetchTeam(page, search);
    }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

    // When a user is selected, pre-populate ratings from their existing evaluator scores
    useEffect(() => {
        if (selected) {
            const initial = {};
            COMPETENCIES.forEach(c => {
                initial[c.key] = {
                    evaluatorRatingValue: selected.competencies?.[c.selfKey]?.evaluatorRating || "",
                    evaluatorNotes: selected.competencies?.[c.selfKey]?.evaluatorNotes || '',
                };
            });
            setCoachRatings(initial);
        }
    }, [selected]);

    const isAllRatingsSet = () => {
        return COMPETENCIES.every(c => {
            const val = coachRatings[c.key]?.evaluatorRatingValue;
            return typeof val === 'number' && val >= 1 && val <= 5;
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const handleSaveReviewAll = async (id, reviewData) => {
        if (!isAllRatingsSet()) {
            toast.error("Please provide a rating for all competencies.");
            return;
        }
        if (submitting) return;
        setSubmitting(true);
        try {
            await saveEvaluatorReview(id, reviewData);
            toast.success('Coach review saved');
            setSelected(null);
            if (onComplete) {
                onComplete();
            } else {
                fetchTeam(page, search);
            }
        } catch (e) {
            handleApiError(e, 'Error saving coach review');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Detail / Review view ───────────────────────────────────────────────────
    if (selected) {
        return (
            <div className="eval-view anim-fade-in">
                <button className="btn btn-ghost mb-8" onClick={() => setSelected(null)}>← Back to List</button>
                <div className="card-sub-hdr">{cycleId > 0 ? `Q${cycleId} Review` : 'Team Member Review'}: {selected.user?.displayName}</div>

                {COMPETENCIES.map(c => (
                    <div key={c.key} className="eval-card mb-8">
                        <div className="card-hdr"><h3>{c.label}</h3></div>
                        <div className="card-body">
                            <div className="form-group">
                                <label>Team Member Self-Rating: <strong>{selected.competencies?.[c.selfKey]?.selfRating || '—'}</strong></label>
                                <p className="evidence-tx" style={{color:'var(--clr-text-muted)', fontSize:'13px', marginTop:'4px'}}>
                                    <strong>Evidence:</strong> {selected.competencies?.[c.selfKey]?.selfEvidence || 'No evidence provided.'}
                                </p>
                                <p className="evidence-tx" style={{color:'var(--clr-text-muted)', fontSize:'13px', marginTop:'8px', fontStyle: 'italic'}}>
                                    <strong>Proposed Growth Action:</strong> {selected.competencies?.[c.selfKey]?.selfAction || 'No action plan provided.'}
                                </p>
                            </div>
                            <div className="form-group">
                                <label className="req">Your Coach Rating</label>
                                <select
                                    className="fi"
                                    value={coachRatings[c.key]?.evaluatorRatingValue || ""}
                                    onChange={e => setCoachRatings(p => ({...p, [c.key]: {...p[c.key], evaluatorRatingValue: e.target.value === "" ? "" : parseInt(e.target.value)}}))}
                                >
                                    <option value="">-- Select Rating --</option>
                                    <option value={1}>1 — Needs Improvement</option>
                                    <option value={2}>2 — Below Expectations</option>
                                    <option value={3}>3 — Meets Expectations</option>
                                    <option value={4}>4 — Above Expectations</option>
                                    <option value={5}>5 — Exceeds Expectations</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Observations</label>
                                <textarea
                                    className="fi"
                                    value={coachRatings[c.key]?.evaluatorNotes || ''}
                                    onChange={e => setCoachRatings(p => ({...p, [c.key]: {...p[c.key], evaluatorNotes: e.target.value}}))}
                                    placeholder="What did you observe this cycle?"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Candidate Reflection Section */}
                <div className="eval-card mb-8">
                    <div className="card-hdr" style={{background: 'linear-gradient(90deg, var(--clr-pri) 0%, var(--clr-brand) 100%)', color: '#fff'}}>
                        <h3>Reflection & Future Goals</h3>
                    </div>
                    <div className="card-body" style={{padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                        {[
                            { label: 'Greatest Achievement', value: selected.reflection?.greatestAchievement, icon: '🏆' },
                            { label: 'Challenges & Resolution', value: selected.reflection?.biggestChallenge, icon: '🧩' },
                            { label: 'Self-Correction', value: selected.reflection?.doDifferently, icon: '🔄' },
                            { label: 'Short-term Goal', value: selected.reflection?.goal1, icon: '🎯' },
                            { label: 'Medium-term Goal', value: selected.reflection?.goal2, icon: '🚀' },
                            { label: 'Focus Area', value: selected.reflection?.priorityCompetency, icon: '📍' },
                            { label: 'General Feedback', value: selected.reflection?.comments, icon: '💬' }
                        ].map((item, idx) => (
                            <div key={idx} className="reflection-block" style={{
                                background: 'rgba(var(--clr-brand-rgb), 0.03)',
                                border: '1px solid var(--clr-border)',
                                borderRadius: '12px',
                                padding: '16px',
                                transition: 'all 0.3s ease'
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
                                    <span style={{fontSize: '18px'}}>{item.icon}</span>
                                    <label style={{fontWeight: 700, color: 'var(--clr-brand)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                                        {item.label}
                                    </label>
                                </div>
                                <p style={{fontSize: '14px', lineHeight: '1.6', color: 'var(--clr-text)', margin: 0}}>
                                    {item.value || '—'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{display:'flex', justifyContent:'flex-end', padding:'16px 0'}}>
                    <button
                        className="btn btn-brand btn-lg"
                        disabled={submitting}
                        onClick={() => handleSaveReviewAll(selected.id, { competencies: coachRatings })}
                    >
                        {submitting ? 'Saving…' : 'Submit Coach Review →'}
                    </button>
                </div>
            </div>
        );
    }

    // ── List / Dashboard view ──────────────────────────────────────────────────
    return (
        <div className="evaluator-hub anim-fade-in">
            <div className="card-hdr-flex">
                <h2>Team Submissions</h2>
                <button className="btn btn-ghost" onClick={onBack}>Exit Dashboard</button>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} style={{display:'flex', gap:'8px', margin:'12px 0'}}>
                <input
                    className="fi"
                    style={{flex:1, maxWidth:'320px'}}
                    type="text"
                    placeholder="Search by name…"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                />
                <button type="submit" className="btn btn-brand btn-s">Search</button>
                {search && (
                    <button type="button" className="btn btn-ghost btn-s" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>
                        Clear
                    </button>
                )}
            </form>

            {loading ? (
                <div className="loader-c">
                    <Skeleton width="100%" height="16px" />
                    <Skeleton width="100%" height="16px" style={{marginTop:'8px'}} />
                    <Skeleton width="80%" height="16px" style={{marginTop:'8px'}} />
                </div>
            ) : (
                <div className="eval-list">
                    {evals.length === 0 ? (
                        <div className="empty-state">
                            {search ? `No evaluations found matching "${search}".` : 'No evaluations found for this cycle yet.'}
                        </div>
                    ) : (
                        <>
                            <table className="eval-table">
                                <thead>
                                    <tr>
                                        <th>Team Member</th>
                                        <th>Cycle</th>
                                        <th>Status</th>
                                        <th>Last Updated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {evals.map(e => (
                                        <tr key={e.id}>
                                            <td className="td-user">
                                                <div className="u-pill-sm">
                                                    <span className="u-nm">{e.user?.displayName || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td><span className="u-pill-sm">Cycle {e.cycleNumber || '?'}</span></td>
                                            <td><span className={`status-tag ${(e.status?.toString() || '').toLowerCase()}`}>{e.status || 'Unknown'}</span></td>
                                            <td className="td-date">{new Date(e.updatedAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}</td>
                                            <td>
                                                <button className="btn btn-s btn-brand" onClick={() => setSelected(e)}>Review →</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination controls */}
                            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'16px', padding:'8px 0'}}>
                                <span style={{color:'var(--clr-text-muted)', fontSize:'13px'}}>
                                    {totalCount} total submission{totalCount !== 1 ? 's' : ''}
                                </span>
                                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                    <button
                                        className="btn btn-ghost btn-s"
                                        disabled={page <= 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        ← Prev
                                    </button>
                                    <span style={{fontSize:'13px', color:'var(--clr-text-muted)'}}>
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        className="btn btn-ghost btn-s"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default EvaluatorDashboard;
