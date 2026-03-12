
import React from 'react';
import { Video } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  idTag: string;
  description: string;
}

const platforms: Platform[] = [
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    idTag: 'PLT-WSP',
    description: 'Direct mobile sync',
    icon: (
      <svg viewBox="0 0 100 100" className="w-7 h-7">
        <path d="M50 15 C30 15 15 30 15 50 C15 58 17 65 22 72 L18 85 L32 81 C38 84 44 85 50 85 C70 85 85 70 85 50 C85 30 70 15 50 15 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M40 40 Q45 35 50 40 T60 50 Q65 65 50 70 Q35 70 30 55 Q30 45 40 40" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    )
  },
  { 
    id: 'google_meet', 
    name: 'Google Meet', 
    idTag: 'PLT-GME',
    description: 'Browser-based entry',
    icon: (
      <svg viewBox="0 0 100 100" className="w-7 h-7">
        <rect x="20" y="25" width="60" height="50" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M40 35 H60 V55 H40 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="50" cy="50" r="16" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
      </svg>
    )
  },
  { 
    id: 'zoom', 
    name: 'Zoom', 
    idTag: 'PLT-ZOM',
    description: 'High-fidelity stream',
    icon: (
      <svg viewBox="0 0 100 100" className="w-7 h-7">
        <rect x="15" y="30" width="50" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M65 38 L85 28 V72 L65 62" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="40" cy="50" r="8" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
      </svg>
    )
  },
  { 
    id: 'teams', 
    name: 'MS Teams', 
    idTag: 'PLT-MST',
    description: 'Enterprise channel',
    icon: (
      <svg viewBox="0 0 100 100" className="w-7 h-7">
        <circle cx="35" cy="30" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M10 75 Q35 50 60 75" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="65" cy="40" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="3 1" />
      </svg>
    )
  },
  { 
    id: 'messenger', 
    name: 'Messenger', 
    idTag: 'PLT-MSG',
    description: 'Social integration',
    icon: (
      <svg viewBox="0 0 100 100" className="w-7 h-7">
        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M30 55 L50 35 L55 50 L70 45 L50 65 L45 50 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    )
  }
];

interface PlatformSelectorProps {
  onSelect: (platformId: string) => void;
  selectedPlatform?: string;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({ onSelect, selectedPlatform }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.5em] flex items-center gap-4">
        <Video size={16} /> Engagement Platform Protocol
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map(platform => {
          const isSelected = selectedPlatform === platform.id;
          return (
            <button
              key={platform.id}
              onClick={() => onSelect(platform.id)}
              className={`relative flex items-center gap-5 p-6 border transition-all text-left group ${
                isSelected 
                  ? 'border-[#36453B] bg-[#36453B]/5 ring-1 ring-[#36453B] shadow-xl' 
                  : 'border-slate-100 bg-[#F8F7F4] hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Corner CAD Brackets */}
              <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors ${isSelected ? 'border-[#36453B]' : 'border-slate-200'}`}></div>
              <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors ${isSelected ? 'border-[#36453B]' : 'border-slate-200'}`}></div>
              
              <div className={`transition-all duration-500 ${isSelected ? 'scale-110 text-[#36453B]' : 'text-slate-300 group-hover:text-[#121212]'}`}>
                {platform.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-black text-[11px] uppercase tracking-tight mb-0.5 transition-colors ${isSelected ? 'text-[#121212]' : 'text-slate-500'}`}>
                  {platform.name}
                </p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate">{platform.description}</p>
              </div>

              {/* ID Tag Layer */}
              <div className="absolute -top-2 -right-2 bg-[#121212] px-1.5 py-0.5 text-[6px] font-black text-white tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-all">
                {platform.idTag}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PlatformSelector;
