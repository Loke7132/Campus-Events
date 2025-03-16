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
    <div className="relative flex items-center w-full">
      <NavArrow direction="left" onClick={handleScrollPrev} hide={hideNav} />
      
      <div
        ref={scrollContainerRef}
        className="flex items-center justify-start overflow-x-auto scrollbar-none px-1 sm:px-2 md:px-3 py-2 space-x-1 sm:space-x-2 md:space-x-2 lg:space-x-2 xl:space-x-4 w-full"
      >
        {getDateRange(currentDate, 7).map((date, index) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
          
          return (
            <DateButton
              key={date.toISOString()}
              ref={isToday ? todayRef : undefined}
              date={date}
              isSelected={isSelected}
              isToday={isToday}
              onClick={() => {
                if (onDateSelect) {
                  onDateSelect(date);
                }
              }}
            />
          );
        })}
      </div>
      
      <NavArrow direction="right" onClick={handleScrollNext} hide={hideNav} />
    </div>
  );
}
