import { useState } from 'react';

export default function FormField({ label, required, field, value, onChange, multiline, placeholder }) {
  const [foc, setFoc] = useState(false);
  const base = {
    width: '100%', padding: '13px 15px', borderRadius: 10, boxSizing: 'border-box',
    border: foc ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
    background: foc ? '#fafaff' : '#f8fafc', color: '#1e293b', fontSize: 15, fontFamily: 'DM Sans,sans-serif',
    lineHeight: 1.65, outline: 'none', resize: 'vertical',
    boxShadow: foc ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
    transition: 'border-color 0.2s,box-shadow 0.2s,background 0.2s'
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 700, color: '#334155', lineHeight: 1.5 }}>
        {label}{required && <span style={{ color: '#6366f1', marginLeft: 4 }}>*</span>}
      </label>
      {multiline
        ? <textarea rows={3} placeholder={placeholder} value={value || ''} onChange={e => onChange(field, e.target.value)} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} style={{ ...base, minHeight: 96 }} />
        : <input type="text" placeholder={placeholder} value={value || ''} onChange={e => onChange(field, e.target.value)} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} style={base} />
      }
    </div>
  );
}
