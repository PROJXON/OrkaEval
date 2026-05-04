import React from 'react';

function OpenDiscussion({ data, onChange }) {
  const handleText = (field, e) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <div className="section-form">
      <div className="form-group">
        <label>Current Role / Responsibility Track</label>
        <input 
          type="text" 
          placeholder="e.g. Frontend Engineering Lead / Momentum Intern" 
          value={data?.roleTrack || ''} 
          onChange={(e) => handleText('roleTrack', e)}
        />
      </div>

      <div className="form-group">
        <label>Review Period</label>
        <input 
          type="text" 
          placeholder="e.g. July - August 2026" 
          value={data?.reviewPeriod || ''} 
          onChange={(e) => handleText('reviewPeriod', e)}
        />
      </div>

      <div className="form-group">
        <label className="req">What's top of mind for you right now?</label>
        <textarea 
          placeholder="General thoughts about your work, energy levels, or focus..." 
          value={data?.topOfMind || ''} 
          onChange={(e) => handleText('topOfMind', e)}
        />
      </div>

      <div className="form-group">
        <label>Key Takeaway from the last 8 weeks</label>
        <textarea 
          placeholder="What is the one thing that stands out most?" 
          value={data?.takeaway || ''} 
          onChange={(e) => handleText('takeaway', e)}
        />
      </div>
    </div>
  );
}

export default OpenDiscussion;
