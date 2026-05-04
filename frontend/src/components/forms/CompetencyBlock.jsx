import React from 'react';

const ratings = [
    { id: 1, label: 'Needs Improvement', emoji: '📉' },
    { id: 2, label: 'Below Expectations', emoji: '📄' },
    { id: 3, label: 'Meets Expectations', emoji: '✅' },
    { id: 4, label: 'Above Expectations', emoji: '⭐' },
    { id: 5, label: 'Exceeds Expectations', emoji: '🚀' }
];

function CompetencyBlock({ letter, title, description, data, onChange }) {
  const handleRating = (rId) => {
    onChange({ ...data, selfRating: rId });
  };

  const handleText = (field, e) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <div className="comp-block">
      <div className="comp-hdr">
        <div className="comp-badge">{letter}</div>
        <div className="comp-info">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      <div className="form-group">
        <label className="req">Self-Rating</label>
        <div className="rating-grid">
          {ratings.map(r => (
            <div 
              key={r.id} 
              className={`rating-item ${data?.selfRating === r.id ? 'sel' : ''}`}
              onClick={() => handleRating(r.id)}
            >
              <div className="r-emoji">{r.emoji}</div>
              <div className="r-n">{r.id}</div>
              <div className="r-l">{r.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="req">Evidence & Examples</label>
        <p className="lbl-hint">Describe 1-2 specific situations from this cycle that support your rating.</p>
        <textarea 
          placeholder="Type your evidence here..." 
          value={data?.selfEvidence || ''}
          onChange={(e) => handleText('selfEvidence', e)}
        />
      </div>

      <div className="form-group">
        <label>What's one action you could take to grow in this area next cycle?</label>
        <textarea 
          placeholder="Type your action plan here..." 
          value={data?.selfAction || ''}
          onChange={(e) => handleText('selfAction', e)}
        />
      </div>
    </div>
  );
}

export default CompetencyBlock;
