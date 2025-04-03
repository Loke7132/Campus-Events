import { useState, useCallback, useRef, useEffect } from "react";
import { MapPinIcon, CalendarIcon, PencilIcon, CheckIcon, PlusIcon, EllipsisVerticalIcon, ShareIcon } from "@heroicons/react/24/outline";
import { formatTime, formatMonthDayYear } from "@/lib/utils";
import { EventData } from "@/lib/supabase";
import EditEventModal from "./EditEventModal";
import AddEvent from "@/components/AddEvent";

export interface EventCardProps {
  event: EventData;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
}

export function EventCard({ event, isSelected, onClick, onEdit }: EventCardProps) {
  // Debug - check if rsvp_link exists
  console.log("Event RSVP link:", event.id, event.rsvp_link);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleEditClick = useCallback(() => {
    setShowEditModal(true);
    setShowDropdown(false);
  }, []);

  const handlePasswordSuccess = useCallback(() => {
    setShowEditModal(false);
    setShowEditForm(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setShowEditForm(false);
    if (onEdit) {
      onEdit();
    }
  }, [onEdit]);

  // Helper to check if the RSVP link is valid
  const hasValidRsvpLink = useCallback(() => {
    return !!event.rsvp_link && event.rsvp_link !== '' && event.rsvp_link !== '#';
  }, [event.rsvp_link]);

  const handleShareClick = useCallback(() => {
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}${event.description ? ` - ${event.description}` : ''}`,
      url: window.location.href // Current URL
    };
    
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => {
          console.log('Event shared successfully');
        })
        .catch((error) => {
          console.error('Error sharing event:', error);
        });
    } else {
      // Fallback for browsers that don't support the Web Share API
      alert('Sharing is not supported in your browser');
    }
    
    setShowDropdown(false);
  }, [event.title, event.description]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div 
        className={`flex overflow-hidden bg-zinc-800 rounded-xl cursor-pointer transition-all w-full sm:w-full md:w-full lg:w-[404px] h-auto min-h-[150px] lg:h-[202px] ${
          isSelected ? 'ring-2 ring-orange-500 shadow-lg' : 'hover:bg-zinc-700/50'
        }`}
        onClick={onClick}
      >
        {/* Image section - square aspect ratio */}
        <div className="w-1/3 sm:w-1/3 md:w-5/12 lg:w-1/2 aspect-square relative">
          {event.image_url ? (
            <img 
              src={event.image_url}
              alt={event.title || 'Event'} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-orange-500/30 to-purple-500/30 flex items-center justify-center">
              <CalendarIcon className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-zinc-400" />
            </div>
          )}
        </div>
        
        {/* Content section */}
        <div className="flex flex-col w-2/3 sm:w-2/3 md:w-7/12 lg:w-1/2 p-2 sm:p-3">
          <div className="flex justify-between items-start relative">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 truncate pr-2">{event.title}</h3>
            <button 
              className="p-1 rounded hover:bg-zinc-700" 
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              <EllipsisVerticalIcon className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-500 flex-shrink-0" />
            </button>
            
            {/* Dropdown menu */}
            {showDropdown && (
              <div 
                ref={dropdownRef}
                className="absolute right-0 top-7 sm:top-8 w-36 sm:w-40 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10"
              >
                <div 
                  className="px-3 sm:px-4 py-2 text-white text-xs sm:text-sm cursor-pointer hover:bg-zinc-700 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick();
                  }}
                >
                  <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Edit Event
                </div>
                <div 
                  className="px-3 sm:px-4 py-2 text-white text-xs sm:text-sm cursor-pointer hover:bg-zinc-700 flex items-center border-t border-zinc-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareClick();
                  }}
                >
                  <ShareIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Share Event
                </div>
              </div>
            )}
          </div>
          
          {/* Description */}
          {event.description && (
            <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 mb-auto w-full">{event.description}</p>
          )}
          
          {/* Time info */}
          {(event.startTime || event.endTime) && (
            <div className="text-xs sm:text-sm text-zinc-400 mb-1 sm:mb-2 w-full">
              <div className="flex items-start">
                <span className="font-medium">Time:</span>
                <span className="truncate ml-1">
                  {event.startTime && formatTime(event.startTime)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </span>
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-4 mt-auto">
            {/* RSVP Button - Always active */}
            <button 
              className="flex items-center justify-center px-2 sm:px-4 py-1 sm:py-1.5 rounded-full bg-zinc-700 text-white text-xs sm:text-sm font-medium"
              onClick={(e) => {
                e.stopPropagation();
                // If there's a valid RSVP link, navigate to it
                if (hasValidRsvpLink()) {
                  window.open(event.rsvp_link, '_blank');
                } else {
                  // If no RSVP link, show an alert
                  alert("No RSVP link available for this event.");
                }
              }}
            >
              RSVP
            </button>
            
            <button 
              className="flex items-center justify-center rounded-full bg-zinc-700 p-1.5 sm:p-2"
              onClick={(e) => {
                e.stopPropagation();
                // Open location in maps if available
                if (event.location) {
                  window.open(`https://maps.google.com/?q=${event.location}`, '_blank');
                }
              }}
              title="View Location"
            >
              <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </button>
            
            <button 
              className="flex items-center justify-center rounded-full bg-zinc-700 p-1.5 sm:p-2"
              onClick={(e) => {
                e.stopPropagation();
                // Add to calendar functionality
                if (event.date && event.startTime && event.endTime) {
                  const startDateTime = `${event.date}T${event.startTime}`;
                  const endDateTime = `${event.date}T${event.endTime}`;
                  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDateTime.replace(/[-:]/g, '')}/${endDateTime.replace(/[-:]/g, '')}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`;
                  window.open(googleCalendarUrl, '_blank');
                }
              }}
              title="Add to Calendar"
            >
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Edit Modal - only show when explicitly triggered from dropdown */}
      {showEditModal && (
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onPasswordVerified={handlePasswordSuccess}
          eventId={event.id || ''}
        />
      )}
      
      {/* Edit Form */}
      {showEditForm && (
        <AddEvent
          eventData={event}
          onEventAdded={handleCloseEdit}
          onClose={handleCloseEdit}
          editMode={true}
        />
      )}
    </>
  );
}
