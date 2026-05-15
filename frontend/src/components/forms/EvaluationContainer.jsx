import { useState, useEffect, useCallback, useRef } from 'react';
import OpenDiscussion from './OpenDiscussion';
import CheckIn from './CheckIn';
import Coaching from './Coaching';
import CompetencyBlock from './CompetencyBlock';
import Reflection from './Reflection';
import SessionFacilitator from './SessionFacilitator';
import { getMyEvaluation, saveSelfEvaluation, submitForm } from '../../api';
import toast from 'react-hot-toast';
import { handleApiError } from '../../utils/errorHandler';
import { Skeleton } from '../ui/Skeleton';

const steps = [
  { id: 0, label: 'Tech', icon: '💻', section: 'Competencies', compKey: 'technicalSkills' },
  { id: 1, label: 'Comms', icon: '💬', section: 'Competencies', compKey: 'communication' },
  { id: 2, label: 'Leadership', icon: '⚔️', section: 'Competencies', compKey: 'leadership' },
  { id: 3, label: 'Growth', icon: '📈', section: 'Competencies', compKey: 'growthLearning' },
  { id: 4, label: 'Culture', icon: '🤝', section: 'Competencies', compKey: 'culture' },
  { id: 5, label: 'Reflect', icon: '📝', section: 'Reflection' }
];

function EvaluationContainer({ cycleId, candidateId, onComplete, initialStep = 0, onBack, program = 'review', profile = {} }) {
  const [step, setStep] = useState(initialStep);
  // ... existing loading/saving/formData ...
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [evaluationStatus, setEvaluationStatus] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving', 'saved', 'error', or ''
  const [sessionResetKey, setSessionResetKey] = useState(0); // bump to force re-mount SessionFacilitator
  const autoSaveTimer = useRef(null);
  const [formData, setFormData] = useState({
    OpenDiscussion: {},
    CheckIn: { moodEmojis: [] },
    Coaching: { developmentTopics: [] },
    Competencies: {
        technicalSkills: {},
        communication: {},
        leadership: {},
        growthLearning: {},
        culture: {}
    },
    Reflection: {},
    Metadata: profile // Store Dashboard profile info
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMyEvaluation(cycleId);
        if (data) {
           // Basic merge strategy
            setEvaluationStatus(data.status);
            setFormData(prev => ({
              ...prev,
              OpenDiscussion: data.openDiscussion || {},
              CheckIn: data.checkIn || { moodEmojis: [] },
              Coaching: data.coaching || { developmentTopics: [] },
              Competencies: data.competencies || {
                 technicalSkills: {}, communication: {}, leadership: {}, growthLearning: {}, culture: {}
              },
              Reflection: data.reflection || {}
            }));
        }
      } catch (e) {
        handleApiError(e, 'Failed to fetch evaluation');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [cycleId]);

  const triggerAutoSave = useCallback(() => {
    setSaveStatus('saving');
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await saveSelfEvaluation(cycleId, formData);
        setIsDirty(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(''), 2000); // clear indicator after 2s
      } catch {
        setSaveStatus('error');
      }
    }, 1500); // slightly faster auto-save
  }, [formData, cycleId]);

  useEffect(() => () => clearTimeout(autoSaveTimer.current), []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleUpdate = (section, sectionData) => {
    setFormData(prev => ({ ...prev, [section]: sectionData }));
    setIsDirty(true);
    triggerAutoSave();
  };

  const handleCompUpdate = (key, compData) => {
    setFormData(prev => ({
        ...prev,
        Competencies: { ...prev.Competencies, [key]: compData }
    }));
    setIsDirty(true);
    triggerAutoSave();
  };

  const submit = async (isDraft = false) => {
    setSaving(true);
    try {
        if (program && program !== 'review') {
            const sectionKey = program === 'discussion' ? 'OpenDiscussion' : program === 'checkin' ? 'CheckIn' : 'Coaching';
            const emptySection = program === 'checkin' ? { moodEmojis: [] } : program === 'coaching' ? { developmentTopics: [] } : {};
            const sessionData = formData[sectionKey];

            const cid = (candidateId && !isNaN(candidateId)) ? parseInt(candidateId) : null;

            await submitForm({
                candidateId: cid,
                formType: program === 'discussion' ? 'open_discussion' : program,
                formData: JSON.stringify(sessionData)
            });

            if (!isDraft) {
                // Clear section data in backend so next session starts fresh
                const clearedFormData = { ...formData, [sectionKey]: emptySection };
                await saveSelfEvaluation(cycleId, clearedFormData);
                setFormData(clearedFormData);
                setSessionResetKey(k => k + 1); // force SessionFacilitator re-mount
            } else {
                await saveSelfEvaluation(cycleId, { ...formData, isDraft: true });
            }
        } else {
            await saveSelfEvaluation(cycleId, { ...formData, isDraft: isDraft });
            if (!isDraft) {
                // Clear all data for performance review too if submitted finally
                const emptyData = {
                    OpenDiscussion: {},
                    CheckIn: { moodEmojis: [] },
                    Coaching: { developmentTopics: [] },
                    Competencies: {
                        technicalSkills: {}, communication: {}, leadership: {}, growthLearning: {}, culture: {}
                    },
                    Reflection: {}
                };
                await saveSelfEvaluation(cycleId, emptyData);
                setFormData(emptyData);
                setSessionResetKey(k => k + 1);
            }
        }

        setIsDirty(false);
        if (isDraft) {
          toast.success('Draft saved');
        } else {
          toast.success(program === 'review' ? 'Evaluation submitted' : 'Session saved — data cleared for next session');
        }
        if (!isDraft) {
            onComplete();
        }
    } catch (e) {
        handleApiError(e, "Failed to save evaluation");
    } finally {
        setSaving(false);
    }
  };

  const isStepComplete = (sId) => {
    const d = formData;
    if (sId >= 0 && sId <= 4) {
        const key = steps[sId].compKey;
        const val = d.Competencies[key]?.selfRating;
        return typeof val === 'number' && val > 0;
    }
    if (sId === 5) return !!(d.Reflection.greatestAchievement?.trim() || d.Reflection.goal1?.trim());
    return false;
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = async () => {
    setShowResetConfirm(false);
    try {
        const emptyData = {
            OpenDiscussion: {},
            CheckIn: { moodEmojis: [] },
            Coaching: { developmentTopics: [] },
            Competencies: {
                technicalSkills: {}, communication: {}, leadership: {}, growthLearning: {}, culture: {}
            },
            Reflection: {}
        };
        await saveSelfEvaluation(cycleId, emptyData);
        setFormData(emptyData);
        setEvaluationStatus('Draft');
        setSessionResetKey(k => k + 1);
        setIsDirty(false);
        setStep(0);
        toast.success('Evaluation reset');
    } catch (e) {
        handleApiError(e, "Failed to reset");
    }
  };

  if (loading) {
    return (
      <div className="loader-c">
        <Skeleton width="320px" height="16px" />
      </div>
    );
  }

  if (program && program !== 'review') {
    const sectionKey = program === 'discussion' ? 'OpenDiscussion' : program === 'checkin' ? 'CheckIn' : 'Coaching';
    const emptySection = program === 'checkin' ? { moodEmojis: [] } : program === 'coaching' ? { developmentTopics: [] } : {};

    return (
      <div className="eval-container anim-fade-in" data-program={program}>
        <div className="eval-card">
          <div className="card-hdr">
            <div className="hdr-step">Program Mode</div>
            <div className="flex justify-between items-center w-full">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2>{program === 'discussion' ? 'Open Discussion' : 
                    program === 'checkin' ? 'Weekly Check-In' : 'Monthly Coaching'}</h2>
                {saveStatus === 'saving' && <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><span className="spinner" style={{ width: 12, height: 12, border: '2px solid var(--clr-brand)', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Saving...</span>}
                {saveStatus === 'saved' && <span style={{ fontSize: '0.85rem', color: 'var(--clr-success)', display: 'flex', alignItems: 'center', gap: 4 }}>✓ Saved</span>}
                {saveStatus === 'error' && <span style={{ fontSize: '0.85rem', color: 'var(--clr-error)' }}>⚠️ Save failed</span>}
              </div>
              <button className="btn-link" onClick={handleReset}>Clear & Restart</button>
            </div>
          </div>
          <div className="card-body">
            <SessionFacilitator 
              key={sessionResetKey}
              type={program}
              data={program === 'discussion' ? formData.OpenDiscussion : 
                    program === 'checkin' ? formData.CheckIn : formData.Coaching} 
              onChange={(d) => handleUpdate(sectionKey, d)} 
            />
          </div>
          <div className="card-ft">
             <div className="ft-l">
                 <button className="btn btn-ghost" onClick={onBack}>← Back to Dashboard</button>
             </div>
             <div className="ft-r">
                 <button className="btn btn-brand btn-glow" disabled={saving} onClick={() => submit(false)}>
                    {saving ? 'Saving...' : '🚀 Save & End Session'}
                 </button>
             </div>
          </div>
        </div>

        {/* Reset Confirm Modal — must be inside the return for program mode */}
        {showResetConfirm && (
          <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-hdr">
                <h3>Clear Session?</h3>
              </div>
              <div className="modal-body">
                This will permanently clear all notes for this session. This action cannot be undone.
              </div>
              <div className="modal-ft">
                <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                <button
                  className="btn btn-brand"
                  style={{ background: '#ef4444', borderColor: '#ef4444' }}
                  onClick={async () => {
                    setShowResetConfirm(false);
                    try {
                      const cleared = { ...formData, [sectionKey]: emptySection };
                      await saveSelfEvaluation(cycleId, cleared);
                      setFormData(cleared);
                      setSessionResetKey(k => k + 1); // force SessionFacilitator re-mount (resets timer/phases)
                      setIsDirty(false);
                      toast.success('Session cleared');
                    } catch (e) {
                      handleApiError(e, 'Failed to clear session');
                    }
                  }}
                >
                  Yes, Clear Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const currentStep = steps[step];

  const isSubmitted = evaluationStatus && evaluationStatus !== 'Draft';

  return (
    <div className="eval-container anim-fade-in" data-program={program || 'review'}>
      <div className="stepper-wrap">
        <div className="stepper-9">
            {steps.map(s => (
            <div 
                key={s.id} 
                className={`s9-item ${step === s.id ? 'active' : ''} ${isStepComplete(s.id) ? 'done' : ''}`}
                onClick={() => setStep(s.id)}
            >
                <div className="s9-dot">{isStepComplete(s.id) ? '✓' : s.id + 1}</div>
                <span className="s9-lbl">{s.label}</span>
            </div>
            ))}
        </div>
      </div>

      <div className="eval-card">
        {isSubmitted && program === 'review' && (
          <div className="alert-premium mb-8 anim-slide-up">
            <div className="flex items-center gap-4">
              <span style={{ fontSize: '1.5rem' }}>✅</span>
              <div>
                <strong style={{ display: 'block', color: 'var(--clr-text)' }}>Evaluation Submitted</strong>
                <span style={{ fontSize: '0.9rem' }}>You have already submitted your self-evaluation for this cycle.</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>Reset & Edit</button>
          </div>
        )}
          <div className="card-hdr">
            <div className="hdr-step">Step {step + 1} of {steps.length}</div>
            <div className="flex justify-between items-center w-full">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2>{currentStep.label}</h2>
                {saveStatus === 'saving' && <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><span className="spinner" style={{ width: 12, height: 12, border: '2px solid var(--clr-brand)', borderRightColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Saving...</span>}
                {saveStatus === 'saved' && <span style={{ fontSize: '0.85rem', color: 'var(--clr-success)', display: 'flex', alignItems: 'center', gap: 4 }}>✓ Saved</span>}
                {saveStatus === 'error' && <span style={{ fontSize: '0.85rem', color: 'var(--clr-error)' }}>⚠️ Save failed</span>}
              </div>
              <button className="btn-link" onClick={handleReset}>Clear & Restart</button>
            </div>
          </div>

        <div className="card-body">
            {step === 0 && (
                <CompetencyBlock 
                    letter="1" title="Technical Skills" 
                    description="Quality, accuracy, and efficiency of work. Meets deadlines."
                    data={formData.Competencies.technicalSkills} 
                    onChange={(d) => handleCompUpdate('technicalSkills', d)} 
                />
            )}
            {step === 1 && (
                <CompetencyBlock 
                    letter="2" title="Communication" 
                    description="Effectively shares ideas and information. Professionalism."
                    data={formData.Competencies.communication} 
                    onChange={(d) => handleCompUpdate('communication', d)} 
                />
            )}
            {step === 2 && (
                <CompetencyBlock 
                    letter="3" title="Leadership & Initiative" 
                    description="Takes ownership. Self-motivated. Guides others."
                    data={formData.Competencies.leadership} 
                    onChange={(d) => handleCompUpdate('leadership', d)} 
                />
            )}
            {step === 3 && (
                <CompetencyBlock 
                    letter="4" title="Growth & Learning" 
                    description="Adaptability. Receptive to feedback. Upskilling."
                    data={formData.Competencies.growthLearning} 
                    onChange={(d) => handleCompUpdate('growthLearning', d)} 
                />
            )}
            {step === 4 && (
                <CompetencyBlock 
                    letter="5" title="Culture & Collaboration" 
                    description="Alignment with values. Positive contribution."
                    data={formData.Competencies.culture} 
                    onChange={(d) => handleCompUpdate('culture', d)} 
                />
            )}

            {step === 5 && <Reflection data={formData.Reflection} onChange={(d) => handleUpdate('Reflection', d)} />}
        </div>

        <div className="card-ft">
            <div className="ft-l">
                 <button className="btn btn-ghost" onClick={onBack}>← Exit</button>
                 <button className="btn btn-ghost ml-2" disabled={saving} onClick={() => submit(true)}>
                    {saving ? '...' : '💾 Save Draft'}
                 </button>
            </div>
            <div className="ft-r">
                <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(s => s -1)}>Back</button>
                {step < steps.length - 1 ? (
                    <button className="btn btn-brand" disabled={!isStepComplete(step)} onClick={() => setStep(s => s + 1)}>Next Step →</button>
                ) : (
                    <button className="btn btn-brand btn-glow" disabled={saving || !isStepComplete(step)} onClick={() => submit(false)}>
                        {saving ? 'Submitting...' : '🚀 Submit Self-Evaluation'}
                    </button>
                )}
            </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <h3>Reset Evaluation?</h3>
            </div>
            <div className="modal-body">
              This will permanently clear all your answers and progress for this cycle. This action cannot be undone.
            </div>
            <div className="modal-ft">
              <button className="btn btn-ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn btn-brand" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={confirmReset}>
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationContainer;
