export default function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0 22px' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#e2e8f0)' }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#94a3b8', fontFamily: 'DM Mono,monospace', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#e2e8f0,transparent)' }} />
    </div>
  );
}
