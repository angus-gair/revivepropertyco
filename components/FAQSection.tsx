import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  title?: string;
  subtitle?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs, title = "Frequently Asked Questions", subtitle }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="py-16 lg:py-20 bg-[#F8F7F4]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-[#121212] mb-4">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-none overflow-hidden"
            >
              <button
                onClick={() => toggle(index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-[#FDFCFB] transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#121212] pr-8">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-[#36453B] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#36453B] flex-shrink-0" />
                )}
              </button>
              <div
                className={`px-8 overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'pb-6 max-h-96' : 'max-h-0'
                }`}
              >
                <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
