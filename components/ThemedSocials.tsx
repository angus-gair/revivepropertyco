
import React from 'react';

interface SocialIconProps {
  platform: 'facebook' | 'messenger' | 'instagram' | 'linkedin';
  label: string;
}

const SocialIcon: React.FC<SocialIconProps> = ({ platform, label }) => {
  const getIcon = () => {
    switch (platform) {
      case 'facebook':
        return <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />;
      case 'messenger':
        return <path d="m7.9 20 2.8-2.8 1.1 1.1 3-3.2 2.8 2.8c1.6-1.2 2.4-3.2 2.4-5.4 0-4.4-3.6-8-8-8s-8 3.6-8 8c0 2.2.8 4.2 2.4 5.4l1.5 2.1z" />;
      case 'instagram':
        return (
          <>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </>
        );
      case 'linkedin':
        return (
          <>
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </>
        );
    }
  };

  return (
    <a 
      href={`#${platform}`}
      className="group relative flex flex-col items-center gap-3 transition-all duration-300"
    >
      <div className="relative p-5 border border-white/10 group-hover:border-[#36453B] transition-colors">
        {/* Technical Corner Brackets */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 group-hover:border-[#36453B]"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 group-hover:border-[#36453B]"></div>
        
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="square" 
          strokeLinejoin="miter"
          className="text-slate-500 group-hover:text-white transition-colors"
        >
          {getIcon()}
        </svg>

        {/* Identification Tag */}
        <div className="absolute -top-1 -right-1 bg-[#121212] px-1 text-[7px] font-black text-slate-700 tracking-widest border border-white/5 uppercase">
          {label}
        </div>
      </div>
      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600 group-hover:text-[#36453B] transition-colors">
        {platform}
      </span>
    </a>
  );
};

export const ThemedSocials: React.FC = () => {
  return (
    <div className="flex gap-8">
      <SocialIcon platform="facebook" label="SOC-FB" />
      <SocialIcon platform="messenger" label="SOC-MS" />
      <SocialIcon platform="instagram" label="SOC-IG" />
      <SocialIcon platform="linkedin" label="SOC-LN" />
    </div>
  );
};
