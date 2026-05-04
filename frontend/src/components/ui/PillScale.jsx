import { useState } from 'react';
import { colorAt, rgba } from '../../utils/colorUtils';

export default function PillScale({ value, onChange, stops, sublabels, minLabel, maxLabel, icon }) {
  const [hov, setHov] = useState(null);
  const disp = hov ?? value;
  const ac = disp ? colorAt(stops, (disp - 1) / 9) : '#94a3b8';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#94a3b8', fontFamily: 'DM Mono,monospace', letterSpacing: '0.05em' }}>
        <span>{minLabel}</span><span>{maxLabel}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, height: 44 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
          const c = colorAt(stops, (n - 1) / 9), sel = value === n, h2 = hov === n, filled = value && n <= value;
          return (
            <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(null)} style={{
              flex: 1, borderRadius: n === 1 ? '999px 6px 6px 999px' : n === 10 ? '6px 999px 999px 6px' : 6, border: 'none', cursor: 'pointer',
              background: sel ? c : filled ? rgba(c, 0.22) : h2 ? rgba(c, 0.14) : '#f1f5f9',
              transition: 'all 0.18s cubic-bezier(.4,0,.2,1)', transform: sel ? 'scaleY(1.25)' : h2 ? 'scaleY(1.1)' : 'scaleY(1)',
              boxShadow: sel ? `0 4px 12px ${rgba(c, 0.4)}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: sel ? '#fff' : filled ? c : '#94a3b8', fontFamily: 'DM Mono,monospace',
            }}>{n}</button>
          );
        })}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
        background: disp ? rgba(ac, 0.07) : '#f8fafc', border: `1.5px solid ${disp ? rgba(ac, 0.22) : '#e2e8f0'}`, minHeight: 46, transition: 'all 0.25s'
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: disp ? ac : '#94a3b8', fontFamily: 'DM Sans,sans-serif', transition: 'color 0.25s' }}>
          {disp ? sublabels[disp] : 'Select a value'}
        </div>
        {disp && <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 18, fontWeight: 800, color: ac, transition: 'color 0.25s' }}>
          {disp}<span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>/10</span>
        </div>}
      </div>
    </div>
  );
}
