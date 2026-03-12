
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
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
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
          className={`h-10 w-10 flex items-center justify-center text-[11px] font-black tracking-tight transition-all rounded-none
            ${past ? 'text-slate-200 cursor-not-allowed' : 'text-slate-700 hover:bg-[#36453B]/5 hover:text-[#36453B]'}
            ${selected ? 'bg-[#121212] text-white hover:bg-[#121212] hover:text-white shadow-xl scale-110 z-10' : ''}
            ${today && !selected ? 'border border-[#36453B] text-[#36453B]' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-[#F8F7F4] border border-slate-200 p-8 shadow-sm rounded-none">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-[#121212]">{monthName} {currentYear}</h4>
        <div className="flex gap-4">
          <button 
            onClick={handlePrevMonth}
            className="p-2 border border-slate-200 hover:bg-white text-[#121212] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 border border-slate-200 hover:bg-white text-[#121212] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="h-10 w-10 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {renderDays()}
      </div>
    </div>
  );
};

export default CalendarPicker;
