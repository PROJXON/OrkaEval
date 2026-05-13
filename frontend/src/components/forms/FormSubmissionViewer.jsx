import { useState, useEffect } from 'react';
import { getFormSubmissionById } from '../../api';
import { handleApiError } from '../../utils/errorHandler';

export default function FormSubmissionViewer({ submissionId, onBack }) {
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const data = await getFormSubmissionById(submissionId);
                setSubmission(data);
            } catch (err) {
                handleApiError(err, 'Failed to load submission details');
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [submissionId]);

    if (loading) return <div className="loader-c" style={{ padding: '40px' }}>Loading record...</div>;
    if (!submission) return <div>Record not found.</div>;

    const data = JSON.parse(submission.formData);
    const type = submission.formType.replace('_', ' ').toUpperCase();

    return (
        <div className="form-submission-viewer anim-fade-in">
            <div className="card-hdr-flex mb-8">
                <div>
                    <span className="mono-tag" style={{ color: 'var(--clr-brand)' }}>{type}</span>
                    <h2 className="mt-2">{submission.candidate?.fullName}'s Session</h2>
                    <p style={{ color: 'var(--clr-text-muted)' }}>
                        Submitted on {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                </div>
                <button className="btn btn-ghost" onClick={onBack}>← Back</button>
            </div>

            <div className="card-glass" style={{ padding: '32px' }}>
                {submission.formType === 'open_discussion' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>TOP OF MIND / UPDATES</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.topOfMind || 'No notes provided.'}</p>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>ISSUE RESOLUTION / NOTES</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.notes || 'No notes provided.'}</p>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>RECAP + NEXT STEPS</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.takeaway || 'No notes provided.'}</p>
                        </div>
                    </div>
                )}

                {submission.formType === 'checkin' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>MOOD / PULSE</h4>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '1.5rem' }}>
                                {data.moodEmojis?.map((e, i) => <span key={i}>{e}</span>) || '—'}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>ATTENDANCE & LOG</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.attendanceLog || 'No notes provided.'}</p>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>TOPICS DISCUSSED</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.topics || 'No notes provided.'}</p>
                        </div>
                    </div>
                )}

                {submission.formType === 'coaching' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>DEVELOPMENT TOPICS</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {data.developmentTopics?.map((t, i) => (
                                    <span key={i} className="stat-tag" style={{ background: 'var(--clr-brand-subtle)', color: 'var(--clr-brand)' }}>{t}</span>
                                )) || '—'}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>COACHING NOTES</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.coachingNotes || 'No notes provided.'}</p>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--clr-brand)', marginBottom: '12px', fontSize: '0.9rem' }}>ACTION PLAN</h4>
                            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.actionPlan || 'No notes provided.'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
