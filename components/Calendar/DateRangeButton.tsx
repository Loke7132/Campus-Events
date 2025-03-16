import { forwardRef } from "react";

interface DateRangeButtonProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const DateRangeButton = forwardRef<HTMLButtonElement, DateRangeButtonProps>(
  function DateRangeButton({ 
    date, 
    isSelected, 
    isToday, 
    isInRange,
    isRangeStart,
    isRangeEnd,
    onClick, 
    disabled = false 
  }, ref) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    
    // Determine styling based on state
    let className = "shrink-0 py-1 sm:py-1.5 md:py-2 px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 transition-all flex items-center justify-center font-medium min-w-[42px] sm:min-w-[48px] md:min-w-[56px] lg:min-w-[48px] xl:min-w-[64px]";
    
    // Apply styling based on priority (disabled > selected > range > today > default)
    if (disabled) {
      className += " opacity-40 cursor-not-allowed text-gray-500";
    } else if (isSelected) {
      // Primary selection - white background
      className += " bg-white text-black font-semibold rounded-full z-10 hover:bg-gray-100";
    } else if (isRangeStart || isRangeEnd) {
      // Range endpoints - white background
      className += " bg-white text-black rounded-full z-10 hover:bg-gray-100";
    } else if (isInRange) {
      // In between range - semi-transparent white
      className += " bg-white/20 text-white hover:bg-white/40";
    } else if (isToday) {
      // Today but not selected - outlined
      className += " text-white border border-white/60 rounded-full hover:bg-white/10";
    } else {
      // Regular date
      className += " text-gray-300 hover:text-white hover:bg-white/10";
    }
    
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={className}
        aria-pressed={isSelected}
        aria-current={isToday ? "date" : undefined}
        disabled={disabled}
      >
        {isToday && !isSelected && !isRangeStart && !isRangeEnd ? (
          <span className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg font-semibold">Today</span>
        ) : (
          <div className="flex flex-col items-center w-full gap-0.5 sm:gap-1">
            <span className="text-sm sm:text-base md:text-lg lg:text-base xl:text-lg">{date.getDate()}</span>
            <span className="text-[10px] sm:text-xs md:text-sm lg:text-xs xl:text-sm opacity-80">{dayName}</span>
          </div>
        )}
      </button>
    );
  }
);

DateRangeButton.displayName = 'DateRangeButton'; 