'use client';

import { useEffect, useState } from 'react';
import { supabase, type EventData } from '@/lib/supabase';
import Map from '@/components/Map';
import Loading from '@/components/Loading';
import Events from '@/components/Events';

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

  const handleEventSelect = (eventId: string) => {
    if (selectedEvent === eventId) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(eventId);
    }
  };

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
    <div className="flex flex-col min-h-screen bg-black overflow-hidden">
      <div className="p-2 sm:p-3 md:p-5 h-screen overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[35%_65%] xl:grid-cols-[30%_70%] gap-2 sm:gap-3 md:gap-4 h-[calc(100vh-16px)] sm:h-[calc(100vh-24px)] md:h-[calc(100vh-40px)] overflow-hidden">
          <div className="h-[60vh] sm:h-[55vh] md:h-[50vh] lg:h-full overflow-hidden">
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
          <div className="h-[calc(40vh-16px)] sm:h-[calc(45vh-24px)] md:h-[calc(50vh-20px)] lg:h-full overflow-hidden rounded-3xl">
            <Map 
              events={events} 
              selectedEvent={selectedEvent} 
              userPos={userPos} 
              onEventSelect={handleEventSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
