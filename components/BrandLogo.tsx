
import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'moss';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "h-10 w-10", variant = 'dark' }) => {
  const colors = {
    light: '#FFFFFF',
    dark: '#121212',
    moss: '#36453B'
  };

  const color = colors[variant];

  return (
    <div className={`${className} relative group transition-transform duration-500 hover:rotate-90`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Technical Grid Lines */}
        <line x1="0" y1="50" x2="100" y2="50" stroke={color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.2" />
        <line x1="50" y1="0" x2="50" y2="100" stroke={color} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.2" />
        
        {/* The Structural R */}
        <path 
          d="M30 20H70V50H50L75 80H55L35 55V80H25V20H30Z" 
          fill={variant === 'light' ? color : 'none'} 
          stroke={color} 
          strokeWidth="3" 
          strokeLinejoin="miter"
        />
        <path d="M35 30H60V40H35V30Z" fill={color} />
        
        {/* Corner Accents (Architectural Markers) */}
        <path d="M0 0V10H2" stroke={color} strokeWidth="1" />
        <path d="M0 0H10V2" stroke={color} strokeWidth="1" />
        <path d="M100 100V90H98" stroke={color} strokeWidth="1" />
        <path d="M100 100H90V98" stroke={color} strokeWidth="1" />
      </svg>
    </div>
  );
};

export default BrandLogo;
