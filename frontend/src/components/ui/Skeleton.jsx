export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px' }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 100%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s infinite'
    }} />
  );
}
