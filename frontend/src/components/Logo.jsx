import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logo = ({ size = 48, className = "" }) => {
  return (
    <div 
      className={`flex items-center gap-4 ${className}`} 
      style={{ 
        userSelect: 'none', 
        cursor: 'pointer',
        display: 'inline-block',
        transition: 'transform 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <img 
        src="/assets/orkaeval-logo.png" 
        alt="OrkaEval Logo" 
        style={{ 
          width: size, 
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
          mixBlendMode: 'multiply'
        }} 
      />
    </div>
  );
};

export default Logo;
