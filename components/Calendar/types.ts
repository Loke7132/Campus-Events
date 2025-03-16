import { RefObject, MouseEventHandler } from "react";

export interface CalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export interface DateRangeCalendarProps {
  onRangeSelect: (range: { start: Date; end: Date | null }) => void;
  selectedRange: { start: Date | null; end: Date | null };
}

export interface DateResult {
  dates: Date[];
  itemsPerPage: number;
  maxScrollIndex: number;
  safeScrollIndex: number;
}

export interface DateButtonRef {
  date: Date;
  ref?: RefObject<HTMLButtonElement>;
}

export interface NavArrowProps {
  direction: 'left' | 'right';
  onClick: MouseEventHandler<HTMLButtonElement>;
  hide?: boolean;
}
