'use client';

import { useState } from 'react';
import { DateRangeHeader } from '@/components/Header/DateRangeHeader';

export default function DateRangePage() {
  const [selectedRange, setSelectedRange] = useState<{ 
    start: Date | null; 
    end: Date | null 
  }>({
    start: null,
    end: null
  });

  return (
    <div className="max-w-3xl mx-auto p-4">
      <DateRangeHeader 
        selectedRange={selectedRange}
        onRangeSelect={setSelectedRange}
      />
      
      <div className="mt-8 bg-zinc-800 p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Selected Range Details</h2>
        {selectedRange.start ? (
          <div className="space-y-2">
            <p>
              <span className="font-medium">Start Date:</span>{' '}
              {selectedRange.start.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {selectedRange.end ? (
              <>
                <p>
                  <span className="font-medium">End Date:</span>{' '}
                  {selectedRange.end.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p>
                  <span className="font-medium">Duration:</span>{' '}
                  {Math.round((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                </p>
              </>
            ) : (
              <p className="text-orange-400">
                Please select an end date to complete the range
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-400">
            No date range selected. Please select a start date.
          </p>
        )}
      </div>
    </div>
  );
} 