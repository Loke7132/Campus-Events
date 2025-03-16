import type { DateResult } from "./types";

export const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

export const getDatesForMonth = (currentDate: Date, windowWidth: number): Date[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                        currentDate.getFullYear() === today.getFullYear();
  const isFutureMonth = (currentDate.getFullYear() > today.getFullYear()) ||
                       (currentDate.getFullYear() === today.getFullYear() && 
                        currentDate.getMonth() > today.getMonth());
  
  if (isCurrentMonth) {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - today.getDate() + 1;
    
    for (let i = 0; i < remainingDays; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
  } else if (isFutureMonth) {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
  }
  
  return dates;
};

export const getVisibleDates = (
  dates: Date[], 
  windowWidth: number, 
  scrollIndex: number
): DateResult => {
  const itemsPerPage = windowWidth >= 640 ? 6 : windowWidth >= 360 ? 3 : 2;
  const maxScrollIndex = Math.max(0, dates.length - itemsPerPage);
  const safeScrollIndex = Math.min(scrollIndex, maxScrollIndex);
  
  return {
    dates: dates.slice(safeScrollIndex, safeScrollIndex + itemsPerPage),
    itemsPerPage,
    maxScrollIndex,
    safeScrollIndex
  };
};

// New function for showing a range of dates, ensuring we start with "today"
export const getDateRange = (date: Date, count: number): Date[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dates: Date[] = [];
  
  // Always include current date as reference point
  let startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  // If date is before today, use today instead
  if (startDate < today) {
    startDate = today;
  }
  
  // Generate count dates starting from startDate
  for (let i = 0; i < count; i++) {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + i);
    newDate.setHours(0, 0, 0, 0);
    dates.push(newDate);
  }
  
  return dates;
};
