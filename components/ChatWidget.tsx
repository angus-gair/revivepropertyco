
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ArrowRight } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage, ServiceType } from '../types';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Technical Support Active. How can I assist with your property restoration today?',
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Pressure washing quote",
    "Epoxy regrouting cost",
    "Rubbish removal rates"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const detectAndSaveService = (text: string) => {
    const t = text.toLowerCase();
    let detected: ServiceType | null = null;
    if (t.includes('pressure') || t.includes('wash')) detected = ServiceType.PRESSURE_WASHING;
    else if (t.includes('mow')) detected = ServiceType.LAWN_MOWING;
    else if (t.includes('regrout')) detected = ServiceType.RE_GROUTING;
    else if (t.includes('rubbish')) detected = ServiceType.RUBBISH_REMOVAL;

    if (detected) localStorage.setItem('revive_last_detected_service', detected);
  };

  const handleSend = async (textToSend: string) => {
    const messageText = textToSend.trim();
    if (!messageText || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    detectAndSaveService(messageText);

    try {
      const responseText = await sendMessageToGemini(userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end font-sans">
      {isOpen && (
        <div className="bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-[90vw] sm:w-80 flex flex-col border border-slate-200 transition-all duration-300 mb-6 h-[450px]">
          <div className="bg-[#121212] p-5 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-white/20 flex items-center justify-center">
                <span className="text-xs font-black tracking-tighter">R</span>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Riv Assistant</h3>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-[#F9F9F7] scrollbar-hide">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3 text-[11px] font-bold leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-[#121212] text-white border-[#121212]'
                    : 'bg-white text-slate-800 border-slate-200 shadow-sm whitespace-pre-wrap'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="p-3 bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(input);
                }
              }}
              placeholder="Query..."
              autoComplete="off"
              className="flex-grow text-[11px] font-bold uppercase tracking-widest px-4 py-3 bg-[#F9F9F7] border-0 focus:ring-1 focus:ring-[#121212] outline-none transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#121212] text-white p-3 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#121212] text-white p-5 shadow-2xl transition-all duration-300 flex items-center gap-3 group ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <MessageCircle size={20} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] pr-2">Concierge</span>
      </button>
    </div>
  );
};

export default ChatWidget;
