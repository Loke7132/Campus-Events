"use client";
import { useState, useRef, useEffect } from "react";
import { DateRangeButton } from "./Calendar/DateRangeButton";
import { NavArrow } from "./Calendar/NavArrow";
import { getDateRange } from "./Calendar/utils";
import type { DateRangeCalendarProps } from "./Calendar/types";

interface Props extends DateRangeCalendarProps {
  hideNav?: boolean;
  daysToShow?: number;
}

export default function DateRangeCalendar({ 
  onRangeSelect, 
  selectedRange, 
  hideNav,
  daysToShow = 14
}: Props) {
  const [currentDate, setCurrentDate] = useState(() => {
    // Use local timezone and ensure we start with today's date
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  });
  
  // Track which date was last clicked (for highlighting)
  const [activeDate, setActiveDate] = useState<string | null>(null);

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

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Scroll handlers
  const handleScrollPrev = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      // Don't go before today
      return newDate < today ? today : newDate;
    });
  };

  const handleScrollNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  // Date selection handler
  const handleDateSelect = (date: Date) => {
    // Update the active date for highlighting
    setActiveDate(date.toDateString());
    
    if (!selectedRange.start) {
      // First selection - set start date
      onRangeSelect({ start: date, end: null });
    } else if (!selectedRange.end) {
      // Second selection - set end date if after start date
      if (date >= selectedRange.start) {
        onRangeSelect({ start: selectedRange.start, end: date });
      } else {
        // If selected date is before start, make it the new start
        onRangeSelect({ start: date, end: null });
      }
    } else {
      // Already have a range, start a new one
      onRangeSelect({ start: date, end: null });
    }
  };

  // Check if a date is within the selected range
  const isDateInRange = (date: Date): boolean => {
    if (!selectedRange.start || !selectedRange.end) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  // Check if a date is the start of the range
  const isRangeStart = (date: Date): boolean => {
    if (!selectedRange.start) return false;
    return date.toDateString() === selectedRange.start.toDateString();
  };

  // Check if a date is the end of the range
  const isRangeEnd = (date: Date): boolean => {
    if (!selectedRange.end) return false;
    return date.toDateString() === selectedRange.end.toDateString();
  };

  // Get dates to display, ensuring we only include today and future dates
  const displayDates = getDateRange(currentDate, daysToShow).filter(date => 
    date.getTime() >= today.getTime()
  );

  // Render function
  return (
    <div className="relative flex items-center w-full">
      <NavArrow 
        direction="left" 
        onClick={handleScrollPrev} 
        hide={hideNav || currentDate.getTime() <= today.getTime()} 
      />
      
      <div
        ref={scrollContainerRef}
        className="flex items-center justify-start overflow-x-auto scrollbar-none px-1 sm:px-2 md:px-3 py-2 space-x-1 sm:space-x-2 md:space-x-2 lg:space-x-2 xl:space-x-4 w-full"
      >
        {displayDates.map((date) => {
          const dateStr = date.toDateString();
          const isToday = dateStr === today.toDateString();
          
          // A date is selected if it's the active date or the start/end of a range
          const isSelected = dateStr === activeDate;
          
          return (
            <DateRangeButton
              key={dateStr}
              ref={isToday ? todayRef : undefined}
              date={date}
              isSelected={isSelected}
              isToday={isToday}
              isInRange={isDateInRange(date)}
              isRangeStart={isRangeStart(date)}
              isRangeEnd={isRangeEnd(date)}
              disabled={false}
              onClick={() => handleDateSelect(date)}
            />
          );
        })}
      </div>
      
      <NavArrow direction="right" onClick={handleScrollNext} hide={hideNav} />
    </div>
  );
} 