"use client";
import Events from "./Events";
import { EventData } from "@/lib/supabase";

interface LeftProps {
    onEventAdded: () => void;
    events: EventData[];
    selectedDate: Date | null;
    onDateSelect: (date: Date | null) => void;
    selectedEvent: string | null;
    onEventSelect: (eventId: string) => void;
}

export default function Left({ 
    onEventAdded,
    events,
    selectedDate,
    onDateSelect,
    selectedEvent,
    onEventSelect
}: LeftProps) {
    return (
        <div className="relative w-full max-w-full overflow-visible h-[calc(100vh-96px)]">
            <Events 
                events={events} 
                selectedEvent={selectedEvent} 
                onEventSelect={onEventSelect}
                onEventAdded={onEventAdded}
                onEventUpdated={onEventAdded}
            />
        </div>
    );
}
