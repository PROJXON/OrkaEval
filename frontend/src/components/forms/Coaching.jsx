import PillScale from '../ui/PillScale';
import SessionRating from '../ui/SessionRating';
import FormField from '../ui/FormField';
import Divider from '../ui/Divider';
import RadioOption from '../ui/RadioOption';
import { EMOJIS, STRESS_STOPS, BW_STOPS, STRESS_LABELS, BW_LABELS } from '../../data/formConstants';
import { rgba } from '../../utils/colorUtils';

export default function Coaching({ data = {}, onChange, activePhase = 0 }) {
  const set = (field, val) => onChange({ ...data, [field]: val });
  const toggleEmoji = (e) => {
    const list = data.moodEmojis || [];
    const next = list.includes(e) ? list.filter(x => x !== e) : list.length < 2 ? [...list, e] : list;
    onChange({ ...data, moodEmojis: next });
  };

  return (
    <div style={{ fontFamily: 'DM Sans,sans-serif', color: '#1e293b' }}>

      {activePhase === 0 && (
        <div>
          <Divider label="PULSE CHECK — PHASE 1" />
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 700, color: '#334155' }}>
              How's your week going? Pick up to <span style={{ color: '#6366f1', fontWeight: 800 }}>2 emojis</span><span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map(e => {
                const sel = (data.moodEmojis || []).includes(e), maxed = (data.moodEmojis || []).length >= 2 && !sel;
                return (
                  <button key={e} onClick={() => toggleEmoji(e)} style={{
                    fontSize: 26, padding: '8px 10px', borderRadius: 12, cursor: maxed ? 'not-allowed' : 'pointer',
                    border: sel ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                    background: sel ? 'rgba(99,102,241,0.08)' : '#f8fafc', opacity: maxed ? 0.3 : 1,
                    transform: sel ? 'scale(1.2) translateY(-2px)' : 'scale(1)',
                    boxShadow: sel ? '0 4px 14px rgba(99,102,241,0.25)' : 'none',
                    transition: 'all 0.2s cubic-bezier(.34,1.56,.64,1)', lineHeight: 1
                  }}>{e}</button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <div style={{ padding: 20, borderRadius: 16, border: '1.5px solid #e2e8f0', background: '#ffffff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 4, fontFamily: 'DM Mono,monospace' }}>⚡ BANDWIDTH</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>How much capacity do you have?</div>
              <PillScale value={data.bandwidthLevel} onChange={v => set('bandwidthLevel', v)} stops={BW_STOPS} sublabels={BW_LABELS} minLabel="1 — Maxed out" maxLabel="10 — Wide open" icon="⚡" />
            </div>
            <div style={{ padding: 20, borderRadius: 16, border: '1.5px solid #e2e8f0', background: '#ffffff' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 4, fontFamily: 'DM Mono,monospace' }}>🌡 STRESS LEVEL</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>How much pressure right now?</div>
              <PillScale value={data.stressLevel} onChange={v => set('stressLevel', v)} stops={STRESS_STOPS} sublabels={STRESS_LABELS} minLabel="1 — Completely calm" maxLabel="10 — Overwhelmed" icon="🌡️" />
            </div>
          </div>
          <FormField label="What are you navigating? Anything affecting your energy, focus or well-being?" required field="stressContext" value={data.stressContext} onChange={set} multiline placeholder="Share openly — this is a safe space…" />
          <FormField label="This past week, one thing you did just for the joy of it?" required field="joyAct" value={data.joyAct} onChange={set} placeholder="A hobby, something new, or totally for you…" />
          <FormField label="What is your WIN for the week?" required field="biggestWin" value={data.biggestWin} onChange={set} multiline placeholder="Big or small — all wins count!" />
        </div>
      )}

      {activePhase === 1 && (
        <div>
          <Divider label="PART A — PURPOSE & PROGRAM ALIGNMENT" />
          <FormField label="What is your current purpose for being in the program and how has it evolved?" required field="currentPurpose" value={data.currentPurpose} onChange={set} multiline placeholder="Reflect on your WHY — has it shifted since you joined?" />
          <FormField label="Where do you feel the strongest alignment or misalignment with that purpose?" required field="purposeAlignment" value={data.purposeAlignment} onChange={set} multiline placeholder="Be honest about where things feel on or off track…" />
          <FormField label="What goals have you actively focused on since our last session?" required field="activeGoals" value={data.activeGoals} onChange={set} multiline placeholder="Reference your Storyboard and recent milestones…" />
          <FormField label="How are your current projects helping you move towards those goals?" required field="projectsHelping" value={data.projectsHelping} onChange={set} multiline placeholder="Connect the dots between your work and your purpose…" />
          <FormField label="What kind of impact do you want to create throughout this program?" required field="programImpact" value={data.programImpact} onChange={set} multiline placeholder="Think big picture — what's your legacy in this program?" />
          <FormField label="How does your participation connect to your 5-year plan?" field="fiveYearPlan" value={data.fiveYearPlan} onChange={set} multiline placeholder="Optional — but worth reflecting on…" />
          <Divider label="PART B — PROJECTS & EXECUTION" />
          <FormField label="What part of your work feels the most meaningful or interesting right now?" required field="mostMeaningfulWork" value={data.mostMeaningfulWork} onChange={set} multiline placeholder="What's lighting you up?" />
          <FormField label="What is one task you have been avoiding?" required field="avoidedTask" value={data.avoidedTask} onChange={set} multiline placeholder="Be honest — what keeps getting pushed?" />
          <FormField label="What tasks are you spending time on that don't add value?" required field="lowValueTasks" value={data.lowValueTasks} onChange={set} multiline placeholder="Low-impact work that's worth cutting or rethinking…" />
          <FormField label="What is one thing you can do to move your project forward?" required field="projectNextStep" value={data.projectNextStep} onChange={set} multiline placeholder="One concrete, actionable next step…" />
          <FormField label="If you had full autonomy, what is one thing you'd do differently?" required field="autonomyChange" value={data.autonomyChange} onChange={set} multiline placeholder="Dream a little — what would change?" />
          <Divider label="PART C — PROFESSIONAL DEVELOPMENT" />
          <FormField label="Communication: How do you communicate best? What do you want to improve?" required field="communicationImprov" value={data.communicationImprov} onChange={set} multiline placeholder="Be specific about channels and what you'd like to work on…" />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 10, fontSize: 14, fontWeight: 700, color: '#334155' }}>Pick one to briefly discuss<span style={{ color: '#6366f1', marginLeft: 4 }}>*</span></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['LinkedIn', 'Resume', 'Portfolio'].map(opt => (
                <RadioOption key={opt} label={opt} selected={data.discussTopic === opt} onSelect={() => set('discussTopic', opt)} />
              ))}
            </div>
          </div>
          <FormField label="How do you feel about it? Any progress or feedback needed?" required field="discussTopicProgress" value={data.discussTopicProgress} onChange={set} multiline placeholder="Current status and what support you need…" />
          <FormField label="Professional Etiquette: What areas could you improve on?" required field="professionalEtiquette" value={data.professionalEtiquette} onChange={set} multiline placeholder="Emails, Slack tone, meeting presence, deadlines…" />
          <Divider label="PART D — PERSONAL INSIGHT & GROWTH" />
          <FormField label="What's something you've done recently that you're proud of?" required field="recentProudMoment" value={data.recentProudMoment} onChange={set} multiline placeholder="Own it — what did you pull off?" />
          <FormField label="What did you do that made that win possible?" required field="winEnabler" value={data.winEnabler} onChange={set} multiline placeholder="Identify the skill, mindset, or action behind it…" />
          <FormField label="What feedback have you received recently, and how did you respond?" required field="recentFeedback" value={data.recentFeedback} onChange={set} multiline placeholder="From coach, teammates, clients — anyone…" />
          <FormField label="What growth/stretch opportunity would help you grow right now?" required field="stretchOpportunity" value={data.stretchOpportunity} onChange={set} multiline placeholder="Something that pushes you — what would that look like?" />
          <Divider label="PART E — ISSUE RESOLUTION" />
          <FormField label="Issue Resolution Notes" required field="issueResolutionNotes" value={data.issueResolutionNotes} onChange={set} multiline placeholder="Capture blockers, support needed, planning, resources, and agreed next actions…" />
        </div>
      )}

      {activePhase === 2 && (
        <div>
          <Divider label="SESSION CLOSING — PHASE 3" />
          <FormField label="Is there anything else you'd like to address, or a way I can support you?" required field="anythingElse" value={data.anythingElse} onChange={set} multiline placeholder="Open floor — any loose ends or things not yet covered?" />
          <FormField label="What would you like to be acknowledged for?" required field="acknowledgeFor" value={data.acknowledgeFor} onChange={set} multiline placeholder="Name it. Make it specific. Make it land." />
          <FormField label="What is your biggest takeaway from today?" required field="biggestTakeaway" value={data.biggestTakeaway} onChange={set} multiline placeholder="One key insight from this session…" />
          <FormField label="What are your next steps or action items?" required field="actionItems" value={data.actionItems} onChange={set} multiline placeholder="Clear, specific, owned — who does what by when?" />
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#334155' }}>
              How valuable was this coaching session?<span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>
            </label>
            <SessionRating value={data.sessionRating} onChange={v => set('sessionRating', v)} />
          </div>
          <FormField label="Why did you give it that rating?" required field="ratingReason" value={data.ratingReason} onChange={set} multiline placeholder="Honest feedback makes the next coaching session even better." />
        </div>
      )}
    </div>
  );
}