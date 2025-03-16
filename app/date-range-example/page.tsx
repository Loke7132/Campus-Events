'use client';

import { useState } from 'react';
import { DateRangeHeader } from '@/components/Header/DateRangeHeader';

export default function DateRangeExamplePage() {
  const [selectedRange, setSelectedRange] = useState<{ 
    start: Date | null; 
    end: Date | null 
  }>({
    start: null,
    end: null
  });

  // Format for display
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not selected';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get duration in days
  const getDuration = (): number => {
    if (!selectedRange.start || !selectedRange.end) return 0;
    return Math.round((selectedRange.end.getTime() - selectedRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <DateRangeHeader 
        selectedRange={selectedRange}
        onRangeSelect={setSelectedRange}
      />
      
      <div className="mt-8 bg-zinc-800/80 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">Selected Range Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-zinc-900/80 p-4 rounded-lg">
            <h3 className="text-orange-400 font-semibold mb-2">Start Date</h3>
            <p className="text-white">{formatDate(selectedRange.start)}</p>
          </div>
          
          <div className="bg-zinc-900/80 p-4 rounded-lg">
            <h3 className="text-orange-400 font-semibold mb-2">End Date</h3>
            <p className="text-white">{formatDate(selectedRange.end)}</p>
          </div>
        </div>
        
        {selectedRange.start && selectedRange.end && (
          <div className="mt-6 bg-orange-500/20 p-4 rounded-lg text-center">
            <p className="text-lg font-bold text-white">
              Duration: {getDuration()} days
            </p>
          </div>
        )}
        
        {selectedRange.start && !selectedRange.end && (
          <div className="mt-6 bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
            <p className="text-orange-400 text-center">
              Please select an end date to complete the range
            </p>
          </div>
        )}
        
        {!selectedRange.start && (
          <div className="mt-6 p-4 rounded-lg border border-dashed border-gray-600">
            <p className="text-gray-400 text-center">
              No date range selected. Select a start date to begin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 