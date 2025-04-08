'use client';

import { useEffect, useState } from 'react';
import { supabase, type EventData } from '@/lib/supabase';
import Map from '@/components/Map';
import Loading from '@/components/Loading';
import Events from '@/components/Events';
import { MapIcon, XMarkIcon } from '@heroicons/react/24/outline';

async function getUserLocation(): Promise<[number, number] | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve([latitude, longitude]);
      },
      (error) => {
        console.error('Error getting location:', error);
        resolve(null);
      }
    );
  });
}

export default function Home() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);

  const handleEventSelect = (eventId: string) => {
    // If clicking the same event again, deselect it
    if (selectedEvent === eventId) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(eventId);
      
      // Check if this is mobile view
      if (typeof window !== 'undefined' && window.innerWidth < 431) {
        // If the event is being clicked from the map, switch to event list
        if (showMapOnMobile) {
          setShowMapOnMobile(false);
        } 
        // If the event is being clicked from the list, switch to map view
        else {
          // Small delay to let the selection highlight appear before switching views
          setTimeout(() => {
            setShowMapOnMobile(true);
          }, 150);
        }
      }
    }
  };

  // Effect to handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // If screen becomes larger than 431px, ensure we're not in mobile map mode
      if (window.innerWidth >= 431) {
        setShowMapOnMobile(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to scroll to selected event in the list when switching back from map view
  useEffect(() => {
    if (!showMapOnMobile && selectedEvent) {
      // Find the selected event element and scroll to it
      setTimeout(() => {
        const selectedEventElement = document.getElementById(`event-${selectedEvent}`);
        if (selectedEventElement) {
          selectedEventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100); // Short delay to ensure DOM is updated
    }
  }, [showMapOnMobile, selectedEvent]);

  // Effect to handle toggleMapView event from the Events component
  useEffect(() => {
    const handleToggleMapView = () => {
      setShowMapOnMobile(!showMapOnMobile);
    };
    
    window.addEventListener('toggleMapView', handleToggleMapView);
    return () => window.removeEventListener('toggleMapView', handleToggleMapView);
  }, [showMapOnMobile]);

  useEffect(() => {
    async function init() {
      try {
        const position = await getUserLocation();
        if (position) {
          setUserPos(position);
        }

        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('startTime', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setEvents(data as EventData[]);
        }
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  useEffect(() => {
    // Filter events by selected date
    async function fetchEventsByDate() {
      try {
        if (!selectedDate) {
          // If no date is selected, get all events
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

          if (error) {
            throw error;
          }

          if (data) {
            setEvents(data as EventData[]);
          }
        } else {
          // If a date is selected, format it to YYYY-MM-DD to match the date field format in the database
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          
          console.log("Filtering events for date:", formattedDate);

          // Query events where the date matches the selected date
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('date', formattedDate)
            .order('startTime', { ascending: true });

          if (error) {
            throw error;
          }

          if (data) {
            console.log("Found events:", data.length);
            setEvents(data as EventData[]);
          }
        }
      } catch (error) {
        console.error('Error fetching events by date:', error);
      }
    }

    fetchEventsByDate();
  }, [selectedDate]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden p-[28px] max-[432px]:p-[20px]">
      <div className="h-[calc(100vh-56px)] max-[432px]:h-[calc(100vh-40px)] overflow-hidden">
        <div className={`flex flex-col lg:flex-row gap-0 h-full overflow-hidden ${showMapOnMobile ? 'max-[431px]:h-full' : ''}`}>
          {/* Map toggle button removed since it's now inside Events component */}

          <div className={`h-[60vh] sm:h-[55vh] md:h-[50vh] lg:h-full lg:w-[435px] xl:w-[38%] 2xl:w-[28%] overflow-y-auto overflow-x-hidden order-2 lg:order-1 relative lg:pr-0 max-[431px]:h-full ${showMapOnMobile && 'max-[431px]:hidden'}`}>
            <Events 
              events={events} 
              selectedEvent={selectedEvent} 
              onEventSelect={handleEventSelect}
              onDateSelect={(date) => setSelectedDate(date)}
              onEventAdded={() => {
                // Refresh events
                supabase
                  .from('events')
                  .select('*')
                  .order('startTime', { ascending: true })
                  .then(({ data, error }) => {
                    if (error) {
                      console.error('Error refreshing events:', error);
                      return;
                    }
                    if (data) {
                      setEvents(data as EventData[]);
                    }
                  });
              }}
              onEventUpdated={() => {
                // Refresh events
                supabase
                  .from('events')
                  .select('*')
                  .order('startTime', { ascending: true })
                  .then(({ data, error }) => {
                    if (error) {
                      console.error('Error refreshing events:', error);
                      return;
                    }
                    if (data) {
                      setEvents(data as EventData[]);
                    }
                  });
              }}
            />
          </div>
          <div className={`h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-full lg:w-[55%] xl:w-[65%] 2xl:w-[73%] overflow-hidden order-1 lg:order-2 relative lg:pl-0 lg:-ml-[2px] mb-4 lg:mb-0 ${!showMapOnMobile && 'max-[431px]:hidden'} ${showMapOnMobile && 'max-[431px]:h-[calc(100vh-56px)] max-[431px]:w-full max-[431px]:mb-0'}`}>
            <Map 
              events={events} 
              selectedEvent={selectedEvent} 
              userPos={userPos} 
              onEventSelect={handleEventSelect}
              onCloseMap={() => setShowMapOnMobile(false)}
              onDateSelect={(date) => setSelectedDate(date)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
