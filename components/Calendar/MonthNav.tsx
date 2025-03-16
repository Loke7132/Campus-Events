interface MonthNavProps {
  month: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthNav({ month, onPrevMonth, onNextMonth }: MonthNavProps) {
  return (
    <div className="flex items-center bg-zinc-800/50 rounded-lg shrink-0">
      <button 
        onClick={onPrevMonth}
        className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
        aria-label="Previous month"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="px-2 text-white text-sm font-medium">
        {month}
      </span>
      <button 
        onClick={onNextMonth}
        className="p-1 hover:bg-zinc-700 rounded-lg transition-colors"
        aria-label="Next month"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

MonthNav.displayName = 'MonthNav';
