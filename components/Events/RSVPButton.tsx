import { useState } from "react";

interface RSVPButtonProps {
  rsvpLink: string;
}

export const RSVPButton = ({ rsvpLink }: RSVPButtonProps) => {
  return (
    <div className="flex items-center gap-1.5">
      <a
        href={rsvpLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white font-medium hover:text-gray-300 transition-colors text-xs sm:text-sm flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span>RSVP</span>
        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
};
