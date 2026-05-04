import { useState } from 'react';
import { rgba } from '../../utils/colorUtils';
import { RATING_DATA } from '../../data/formConstants';

export default function SessionRating({ value, onChange }) {
  const [hov, setHov] = useState(null);
  const disp = hov ?? value, info = disp ? RATING_DATA[disp] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const d = RATING_DATA[n], sel = value === n, h2 = hov === n;
          return (
            <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(null)} style={{
              flex: 1, height: 52, borderRadius: 12, cursor: 'pointer',
              border: sel ? `2px solid ${d.color}` : h2 ? `1.5px solid ${d.color}66` : '1.5px solid #e2e8f0',
              background: sel ? rgba(d.color, 0.1) : h2 ? rgba(d.color, 0.05) : '#f8fafc',
              transition: 'all 0.2s cubic-bezier(.34,1.56,.64,1)',
              transform: sel ? 'scale(1.12) translateY(-3px)' : h2 ? 'scale(1.06) translateY(-1px)' : 'scale(1)',
              boxShadow: sel ? `0 6px 20px ${rgba(d.color, 0.28)}` : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            }}>
              <span style={{ fontSize: sel ? 18 : 14, lineHeight: 1, transition: 'font-size 0.2s' }}>{d.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: sel || h2 ? d.color : '#94a3b8', fontFamily: 'DM Mono,monospace', transition: 'color 0.2s' }}>{n}</span>
            </button>
          );
        })}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderRadius: 14,
        border: `1.5px solid ${info ? rgba(info.color, 0.2) : '#e2e8f0'}`,
        background: info ? rgba(info.color, 0.05) : '#f8fafc', minHeight: 62, transition: 'all 0.3s'
      }}>
        <span style={{ fontSize: 34, lineHeight: 1, filter: info ? 'none' : 'grayscale(1) opacity(0.3)', transition: '0.25s' }}>{info?.emoji ?? '🤷'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: info?.color ?? '#94a3b8', fontFamily: 'DM Sans,sans-serif', transition: 'color 0.25s' }}>
            {info?.label ?? 'Select a rating above'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{disp ? `${disp} out of 10` : 'Tap any number 1 – 10'}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <div key={n} style={{
            flex: 1, height: 5, borderRadius: 3,
            background: value && n <= value ? RATING_DATA[n].color : '#e2e8f0',
            boxShadow: value && n <= value ? `0 0 6px ${rgba(RATING_DATA[n].color, 0.5)}` : 'none', transition: 'all 0.25s'
          }} />
        ))}
      </div>
    </div>
  );
}
