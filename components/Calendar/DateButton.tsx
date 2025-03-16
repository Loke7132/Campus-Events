import { forwardRef } from "react";

interface DateButtonProps {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
}

export const DateButton = forwardRef<HTMLButtonElement, DateButtonProps>(
  function DateButton({ date, isSelected, isToday, onClick }, ref) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={`
          shrink-0 py-1 sm:py-1.5 md:py-2 px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 transition-all 
          flex items-center justify-center font-medium min-w-[42px] sm:min-w-[48px] md:min-w-[56px] lg:min-w-[48px] xl:min-w-[64px]
          ${isToday
            ? 'bg-white text-black hover:bg-white rounded-full'
            : isSelected
              ? 'text-white hover:text-white font-semibold'
              : 'text-gray-300 hover:text-white'
          }
        `}
        aria-pressed={isSelected}
        aria-current={isToday ? "date" : undefined}
      >
        {isToday ? (
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

DateButton.displayName = 'DateButton';
