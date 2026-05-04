export default function RadioOption({ label, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 10, cursor: 'pointer',
      border: selected ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
      background: selected ? 'rgba(99,102,241,0.06)' : '#f8fafc',
      color: selected ? '#4f46e5' : '#475569',
      fontWeight: 700, fontSize: 14, fontFamily: 'DM Sans,sans-serif', transition: 'all 0.18s',
      boxShadow: selected ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none'
    }}>{label}</div>
  );
}
