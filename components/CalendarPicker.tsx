
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  minDate: string;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ selectedDate, onDateSelect, minDate }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate || minDate));
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    const d = new Date(selectedDate);
    return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  };

  const isPast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    const min = new Date(minDate);
    date.setHours(0,0,0,0);
    min.setHours(0,0,0,0);
    return date < min;
  };

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentYear, currentMonth);
    const startDay = firstDayOfMonth(currentYear, currentMonth);

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const past = isPast(day);
      const selected = isSelected(day);
      const today = isToday(day);

      days.push(
        <button
          key={day}
          disabled={past}
          onClick={() => {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            onDateSelect(dateStr);
          }}
          className={`aspect-square flex items-center justify-center text-[10px] font-black transition-all duration-500 relative group/day
            ${past ? 'text-slate-200 cursor-not-allowed' : 'text-[#121212] hover:text-[#36453B]'}
            ${selected ? 'text-white' : ''}
          `}
        >
          {/* High-Fidelity Selection Hex */}
          <div className={`absolute inset-1.5 transition-all duration-500 rounded-sm ${selected ? 'bg-[#121212] rotate-0 opacity-100 scale-100' : 'bg-slate-100 opacity-0 scale-50 group-hover/day:opacity-100 group-hover/day:scale-100 rotate-12'}`}></div>
          
          <span className="relative z-10">{day}</span>
          
          {today && !selected && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#36453B] rounded-full"></div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white border border-slate-100 p-6 relative group/calendar">
      {/* Corner Marking */}
      <div className="absolute top-0 left-0 w-4 h-px bg-slate-200"></div>
      <div className="absolute top-0 left-0 w-px h-4 bg-slate-200"></div>

      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#121212] flex items-center gap-3">
          <span className="w-2 h-2 bg-[#36453B]/10 rounded-full"></span>
          {monthName} <span className="text-slate-300 font-bold">{currentYear}</span>
        </h4>
        <div className="flex gap-1">
          <button 
            onClick={handlePrevMonth}
            className="w-8 h-8 flex items-center justify-center border border-slate-100 hover:bg-slate-50 text-[#121212] transition-all rounded-sm"
          >
            <ChevronLeft size={12} strokeWidth={3} />
          </button>
          <button 
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center border border-slate-100 hover:bg-slate-50 text-[#121212] transition-all rounded-sm"
          >
            <ChevronRight size={12} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2 border-b border-slate-50">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="aspect-square flex items-center justify-center text-[8px] font-black text-slate-300 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {renderDays()}
      </div>
    </div>
  );
};

export default CalendarPicker;
