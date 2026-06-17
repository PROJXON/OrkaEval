import { useState, useRef, useEffect } from 'react';

export default function CoachSearchDropdown({ coaches, value, onChange, placeholder = "Select a coach...", disabled = false, clearText = "None (Clear selection)" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sort coaches alphabetically by name
  const sortedCoaches = [...coaches].sort((a, b) => {
    if (!a.fullName) return 1;
    if (!b.fullName) return -1;
    return a.fullName.localeCompare(b.fullName);
  });

  const filteredCoaches = sortedCoaches.filter(c => 
    c.fullName && c.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCoach = coaches.find(c => c.id === value || String(c.id) === String(value));

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{ 
          width: '100%', padding: '12px', borderRadius: '10px', 
          border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)', 
          color: 'var(--clr-text)', fontSize: '0.9rem', cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <span>{selectedCoach ? selectedCoach.fullName : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          marginTop: '4px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
          borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', maxHeight: '300px'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--clr-border)' }}>
            <input 
              type="text" 
              placeholder="Search coach..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '6px',
                border: '1px solid var(--clr-border)', background: 'var(--clr-surface-2)',
                color: 'var(--clr-text)', fontSize: '0.9rem', outline: 'none'
              }}
              autoFocus
            />
          </div>
          <div style={{ overflowY: 'auto' }}>
            <div 
              onClick={() => { onChange(""); setIsOpen(false); setSearchTerm(""); }}
              style={{
                padding: '10px 16px', cursor: 'pointer', fontSize: '0.9rem',
                color: 'var(--clr-text-muted)', borderBottom: '1px solid var(--clr-border)',
                background: (value === "" || value === null || value === undefined) ? 'var(--clr-surface-2)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!(value === "" || value === null || value === undefined)) e.target.style.background = 'var(--clr-surface-2)';
              }}
              onMouseLeave={(e) => {
                if (!(value === "" || value === null || value === undefined)) e.target.style.background = 'transparent';
              }}
            >
              {clearText}
            </div>
            {filteredCoaches.length === 0 ? (
              <div style={{ padding: '10px 16px', fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>No coaches found</div>
            ) : (
              filteredCoaches.map(c => {
                const isSelected = value === c.id || String(value) === String(c.id);
                return (
                  <div 
                    key={c.id}
                    onClick={() => { onChange(c.id); setIsOpen(false); setSearchTerm(""); }}
                    style={{
                      padding: '10px 16px', cursor: 'pointer', fontSize: '0.9rem',
                      background: isSelected ? 'var(--clr-brand)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--clr-text)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.target.style.background = 'var(--clr-surface-2)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.target.style.background = 'transparent';
                    }}
                  >
                    {c.fullName}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
