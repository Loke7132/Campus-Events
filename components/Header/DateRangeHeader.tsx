import DateRangeCalendar from "../DateRangeCalendar";
import { DateRangeCalendarProps } from "../Calendar/types";

export const DateRangeHeader = ({ onRangeSelect, selectedRange }: DateRangeCalendarProps) => {
  // Format the range display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate duration if both dates are selected
  const getDuration = (): string => {
    if (!selectedRange.start || !selectedRange.end) return '';
    const days = Math.round((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <div className="w-full flex flex-col mb-0">
      <div className="w-full px-6 py-4 bg-orange-500 rounded-3xl shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-3 tracking-wider">
          E V<span className="inline-block transform rotate-12">⚡</span>NTS
        </h1>
        
        {selectedRange.start && (
          <div className="bg-white/10 text-white text-sm mb-3 p-2 rounded-lg font-medium">
            {selectedRange.end ? (
              <div className="flex justify-between items-center">
                <span>{formatDate(selectedRange.start)} - {formatDate(selectedRange.end)}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{getDuration()}</span>
              </div>
            ) : (
              <div>Starting from {formatDate(selectedRange.start)}</div>
            )}
          </div>
        )}
        
        <div className="flex justify-center">
          <div className="bg-black rounded-full p-1 shadow-md w-full">
            <DateRangeCalendar 
              onRangeSelect={onRangeSelect} 
              selectedRange={selectedRange} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 