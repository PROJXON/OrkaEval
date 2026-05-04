import PillScale from '../ui/PillScale';
import SessionRating from '../ui/SessionRating';
import FormField from '../ui/FormField';
import Divider from '../ui/Divider';
import RadioOption from '../ui/RadioOption';
import { EMOJIS, STRESS_STOPS, BW_STOPS, STRESS_LABELS, BW_LABELS } from '../../data/formConstants';

const topicsList = [
  { id: 'Issue Resolution', icon: '🚧', label: 'Issue Resolution' },
  { id: 'Foundational Success (Dashboard, Professional Etiquette)', icon: '🏗️', label: 'Foundational Success — Dashboard, Etiquette' },
  { id: 'Professional Development (LinkedIn, Resume, Portfolio)', icon: '💼', label: 'Professional Development — LinkedIn, Resume, Portfolio' },
  { id: 'Project Work (Scope, Roadmap, Feedback, Handoff)', icon: '📊', label: 'Project Work — Scope, Roadmap, Feedback, Handoff' },
  { id: 'Skill Development (Courses, Workshops, Leadership skills)', icon: '🛠️', label: 'Skill Development (Courses, Workshops, Leadership skills)' },
  { id: 'Culture & Connection (Engagement, Alignment, Networking)', icon: '🤝', label: 'Culture & Connection (Engagement, Alignment, Networking)' },
  { id: 'Personal Development (Life–Work Balance, Goals, Growth)', icon: '🌱', label: 'Personal Development (Life–Work Balance, Goals, Growth)' },
];

const meetings = [
  { id: 'Monday Company Kick-Off', icon: '🚀', label: 'Monday Company Kick-Off' },
  { id: 'Team Stand-Up', icon: '🗣️', label: 'Team Stand-Up' },
  { id: 'Team Sync', icon: '🔄', label: 'Team Sync' },
  { id: 'Weekly 1:1', icon: '🛠️', label: 'Weekly 1:1' },
  { id: 'Friday Showcase', icon: '🏆', label: 'Friday Showcase' },
];

function CheckIn({ data = {}, onChange, activePhase = 0 }) {
  const set = (field, val) => onChange({ ...data, [field]: val });

  const toggleEmoji = (e) => {
    const list = data.moodEmojis || [];
    const next = list.includes(e) ? list.filter(x => x !== e) : list.length < 2 ? [...list, e] : list;
    onChange({ ...data, moodEmojis: next });
  };

  const toggleArray = (field, val) => {
    const list = data[field] || [];
    onChange({ ...data, [field]: list.includes(val) ? list.filter(x => x !== val) : [...list, val] });
  };

  // ── Phase 0: Pulse check ─────────────────────────────────────────────────
  if (activePhase === 0) return (
    <div style={{ fontFamily: 'DM Sans,sans-serif', color: '#1e293b' }}>
      <Divider label="PULSE CHECK (PHASE 1 & 2)" />

      {/* Emoji picker */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 700, color: '#334155' }}>
          How's your week going? Pick up to <span style={{ color: '#6366f1', fontWeight: 800 }}>2 emojis</span>
          <span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EMOJIS.map(e => {
            const sel = (data.moodEmojis || []).includes(e);
            const maxed = (data.moodEmojis || []).length >= 2 && !sel;
            return (
              <button key={e} onClick={() => toggleEmoji(e)} style={{
                fontSize: 26, padding: '8px 10px', borderRadius: 12,
                cursor: maxed ? 'not-allowed' : 'pointer',
                border: sel ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                background: sel ? 'rgba(99,102,241,0.08)' : '#f8fafc',
                opacity: maxed ? 0.3 : 1,
                transform: sel ? 'scale(1.2) translateY(-2px)' : 'scale(1)',
                boxShadow: sel ? '0 4px 14px rgba(99,102,241,0.25)' : 'none',
                transition: 'all 0.2s cubic-bezier(.34,1.56,.64,1)', lineHeight: 1,
              }}>{e}</button>
            );
          })}
        </div>
      </div>

      <FormField label="What's the one thing you want to walk away with today?" required field="mainGoal" value={data.mainGoal} onChange={set} multiline placeholder="What does success look like for this session?" />

      {/* Stress + Bandwidth side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div style={{ padding: 20, borderRadius: 16, border: '1.5px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 4, fontFamily: 'DM Mono,monospace' }}>🌡 STRESS LEVEL</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>How much pressure right now?</div>
          <PillScale value={data.stressLevel} onChange={v => set('stressLevel', v)} stops={STRESS_STOPS} sublabels={STRESS_LABELS} minLabel="1 — Completely calm" maxLabel="10 — Overwhelmed" icon="🌡️" />
        </div>
        <div style={{ padding: 20, borderRadius: 16, border: '1.5px solid #e2e8f0', background: '#ffffff' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 4, fontFamily: 'DM Mono,monospace' }}>⚡ BANDWIDTH</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>How much capacity do you have?</div>
          <PillScale value={data.bandwidthLevel} onChange={v => set('bandwidthLevel', v)} stops={BW_STOPS} sublabels={BW_LABELS} minLabel="1 — Maxed out" maxLabel="10 — Wide open" icon="⚡" />
        </div>
      </div>

      <FormField label="Anything affecting your energy, focus or well-being?" required field="stressContext" value={data.stressContext} onChange={set} multiline placeholder="Share openly — this is a safe space…" />
      <FormField label="How do you feel about your current bandwidth?" required field="bandwidthContext" value={data.bandwidthContext} onChange={set} multiline placeholder="Would you like to adjust your current load?" />
      <FormField label="One thing you did this week just for the joy of it?" required field="joyAct" value={data.joyAct} onChange={set} placeholder="A hobby, a walk, something new…" />
      <FormField label="What is your WIN for the past week?" required field="biggestWin" value={data.biggestWin} onChange={set} multiline placeholder="Celebrate it! Don't be shy." />
    </div>
  );

  // ── Phase 1: Attendance ──────────────────────────────────────────────────
  if (activePhase === 1) return (
    <div style={{ fontFamily: 'DM Sans,sans-serif', color: '#1e293b' }}>
      <Divider label="ATTENDANCE & LOG (PHASE 3)" />

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 700, color: '#334155' }}>
          Is your attendance record accurate and fully updated?<span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['✅ Yes – fully updated', '❌ No – updating now', '⚠️ Partially updated'].map(opt => (
            <RadioOption key={opt} label={opt} selected={data.attendanceUpdated === opt} onSelect={() => set('attendanceUpdated', opt)} />
          ))}
        </div>
      </div>

      <FormField label="Attendance challenges? Note agreed next steps." required field="attendanceChallenges" value={data.attendanceChallenges} onChange={set} multiline placeholder="Issues + agreed-upon next steps…" />

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 700, color: '#334155' }}>
          Of your five required meetings, which do you find most valuable and why?<span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {meetings.map(m => {
            const sel = data.mostValuableMeeting === m.id;
            return (
              <div key={m.id} onClick={() => set('mostValuableMeeting', m.id)} style={{
                border: sel ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                background: sel ? 'rgba(99,102,241,0.06)' : '#f8fafc',
                borderRadius: 12, padding: '12px 16px', cursor: 'pointer', transition: 'all 0.18s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: sel ? '#4f46e5' : '#1e293b' }}>{m.label}</span>
                </div>
                {sel && (
                  <textarea rows={2} placeholder="Why is this your most valuable meeting?" value={data.mostValuableWhy || ''} onChange={e => { e.stopPropagation(); set('mostValuableWhy', e.target.value); }} onClick={e => e.stopPropagation()} style={{ marginTop: 12, width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 14, fontFamily: 'DM Sans,sans-serif', outline: 'none', resize: 'vertical' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <FormField label="Which additional meetings are you attending?" required field="additionalMeetings" value={data.additionalMeetings} onChange={set} placeholder="Other meetings, workshops, deep work sessions…" />
    </div>
  );

  // ── Phase 2: Topics ──────────────────────────────────────────────────────
  if (activePhase === 2) return (
    <div style={{ fontFamily: 'DM Sans,sans-serif', color: '#1e293b' }}>
      <Divider label="PARTICIPANT-LED TOPICS (PHASE 3)" />

      <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic', padding: '12px 16px', borderLeft: '3px solid #6366f1', background: '#f8fafc', borderRadius: '0 10px 10px 0', marginBottom: 20, lineHeight: 1.6 }}>
        This section is for diving deeper into desired topics. All suggested topics (except Issue Resolution and Other) are drawn directly from our Success Metrics framework. When choosing your topics, try to connect them back to the relevant metrics.
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 700, color: '#334155' }}>
          What topic(s) do you want to dive deeper into today? (Pick 1–2 categories, ~15–20 min)<span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {topicsList.map(t => {
            const sel = (data.developmentTopics || []).includes(t.id);
            return (
              <label key={t.id} onClick={() => toggleArray('developmentTopics', t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                border: sel ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                background: sel ? 'rgba(99,102,241,0.06)' : '#f8fafc', transition: 'all 0.18s',
              }}>
                <input type="checkbox" checked={sel} readOnly style={{ accentColor: '#6366f1', width: 16, height: 16 }} />
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: sel ? '#4f46e5' : '#1e293b' }}>{t.label}</span>
              </label>
            );
          })}
          {/* Other */}
          <label onClick={() => toggleArray('developmentTopics', 'Other')} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
            border: (data.developmentTopics || []).includes('Other') ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
            background: (data.developmentTopics || []).includes('Other') ? 'rgba(99,102,241,0.06)' : '#f8fafc', transition: 'all 0.18s',
          }}>
            <input type="checkbox" checked={(data.developmentTopics || []).includes('Other')} readOnly style={{ accentColor: '#6366f1', width: 16, height: 16 }} />
            <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>Other:</span>
            {(data.developmentTopics || []).includes('Other') && (
              <input type="text" placeholder="Specify..." value={data.otherTopic || ''} onChange={e => { e.stopPropagation(); set('otherTopic', e.target.value); }} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 14, fontFamily: 'DM Sans,sans-serif', outline: 'none' }} />
            )}
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 700, color: '#334155' }}>
          Are there specific Success Metrics you want to review?<span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['✅ Yes', '❌ No', '🤔 Maybe (I need to check the Success Metrics list)'].map(opt => (
            <RadioOption key={opt} label={opt} selected={data.successMetricsReview === opt} onSelect={() => set('successMetricsReview', opt)} />
          ))}
        </div>
      </div>

      <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginBottom: 12 }}>
        Spend 15–20 minutes going over the selected topics before returning to this form. Ensure you have ~5 min left to complete the check-in form.
      </div>
      <FormField label="What were the main takeaways and next steps from your discussion?" required field="takeaways" value={data.takeaways} onChange={set} multiline placeholder="Key decisions. Action items. Who does what by when." />
    </div>
  );

  // ── Phase 3: Closing ─────────────────────────────────────────────────────
  if (activePhase === 3) return (
    <div style={{ fontFamily: 'DM Sans,sans-serif', color: '#1e293b' }}>
      <Divider label="SESSION CLOSING (PHASE 4)" />

      <FormField label="What would you like to be acknowledged for?" required field="acknowledgeParticipant" value={data.acknowledgeParticipant} onChange={set} multiline placeholder="Name it. Make it specific. Make it land." />
      <FormField label="What do you need from me?" required field="needsFromLead" value={data.needsFromLead} onChange={set} multiline placeholder="Support, resources, clarity, feedback…" />
      <FormField label="What do I need from you? (coach to participant)" required field="needsFromParticipant" value={data.needsFromParticipant} onChange={set} multiline placeholder="Commitments, follow-through, communication…" />

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#334155' }}>
          How would you rate this Check-In?<span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>
        </label>
        <SessionRating value={data.sessionRating} onChange={v => set('sessionRating', v)} />
      </div>

      <FormField label="Why that rating? Any improvement ideas?" required field="ratingReason" value={data.ratingReason} onChange={set} multiline placeholder="Honest feedback makes the next session better." />
    </div>
  );

  return null;
}

export default CheckIn;