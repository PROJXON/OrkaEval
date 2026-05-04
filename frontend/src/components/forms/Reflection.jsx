import React from 'react';

function Reflection({ data, onChange }) {
  const handleText = (field, e) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <div className="section-form">
      <div className="card-sub-hdr">Reflection & Future Goals</div>

      <div className="form-group">
        <label className="req">What was your greatest achievement during this cycle?</label>
        <textarea 
          placeholder="Describe the impact of this achievement..." 
          value={data?.greatestAchievement || ''} 
          onChange={(e) => handleText('greatestAchievement', e)}
        />
      </div>

      <div className="form-group">
        <label>What was your biggest challenge, and how did you handle it?</label>
        <textarea 
          placeholder="Describe the obstacles and your resolution..." 
          value={data?.biggestChallenge || ''} 
          onChange={(e) => handleText('biggestChallenge', e)}
        />
      </div>

      <div className="form-group">
        <label>What would you do differently if you could start the cycle over?</label>
        <textarea 
          placeholder="Identify areas for self-correction..." 
          value={data?.doDifferently || ''} 
          onChange={(e) => handleText('doDifferently', e)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Goal 1 (Short-term)</label>
          <input type="text" value={data?.goal1 || ''} onChange={(e) => handleText('goal1', e)} />
        </div>
        <div className="form-group">
          <label>Goal 2 (Medium-term)</label>
          <input type="text" value={data?.goal2 || ''} onChange={(e) => handleText('goal2', e)} />
        </div>
      </div>

      <div className="form-group">
        <label>Priority Development Competency</label>
        <input 
            type="text" 
            placeholder="Which area (A-E) is your primary focus for next cycle?" 
            value={data?.priorityCompetency || ''} 
            onChange={(e) => handleText('priorityCompetency', e)} 
        />
      </div>

      <div className="form-group">
        <label>General Comments or Feedback for your Supervisor</label>
        <textarea 
          placeholder="Anything else you want to share?" 
          value={data?.comments || ''} 
          onChange={(e) => handleText('comments', e)}
        />
      </div>
    </div>
  );
}

export default Reflection;
