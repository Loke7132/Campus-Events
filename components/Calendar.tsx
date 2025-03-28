"use client";
import { useState, useRef, useEffect } from "react";
import { DateButton } from "./Calendar/DateButton";
import { NavArrow } from "./Calendar/NavArrow";
import { getDateRange } from "./Calendar/utils";
import type { CalendarProps } from "./Calendar/types";

interface Props extends CalendarProps {
  hideNav?: boolean;
}

export default function Calendar({ onDateSelect, selectedDate, hideNav }: Props) {
  const [currentDate, setCurrentDate] = useState(() => {
    // Use local timezone
    const now = new Date();
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  });

  const todayRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize scroll position to Today button
  useEffect(() => {
    if (todayRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const button = todayRef.current;
      const scrollTo = button.offsetLeft - (container.clientWidth / 2) + (button.clientWidth / 2);
      container.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }, []);

  // Scroll handlers
  const handleScrollPrev = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  };

  const handleScrollNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  // Render function
  return (
    <div className="flex items-center justify-between px-[5px] relative w-full max-w-[398px]">
      <button 
        className="bg-white text-black rounded-full h-[32px] w-[98px] font-medium text-sm ml-[5px]"
        onClick={() => onDateSelect && onDateSelect(new Date())}
      >
        Today
      </button>
      
      <button 
        className="text-white w-[32px] h-[32px] flex items-center justify-center ml-[36px] bg-gray-800 rounded-full" 
        onClick={handleScrollPrev}
        aria-label="Previous days"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      
      <div className="flex justify-between w-[69px] text-center">
        {getDateRange(currentDate, 3).map((date, index) => (
          <div 
            key={date.toISOString()}
            className="flex flex-col items-center w-[23px]" 
            onClick={() => onDateSelect && onDateSelect(date)}
          >
            <div className="text-white text-sm font-medium">
              {date.getDate()}
            </div>
            <div className="text-gray-400 text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
            </div>
          </div>
        ))}
      </div>
      
      <button 
        className="text-white w-[32px] h-[32px] flex items-center justify-center mr-[36px] bg-gray-800 rounded-full" 
        onClick={handleScrollNext}
        aria-label="Next days"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
