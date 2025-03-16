import type { FC } from "react";
import { PopoverContent } from "@/components/ui/popover";

export const ImportantNotes: FC = () => (
    <PopoverContent 
        className="bg-zinc-900 border-zinc-600 text-zinc-200 w-72"
        role="dialog"
        aria-label="Important notes about building access and availability"
    >
        <h2 className="font-bold mb-1">Important Notes:</h2>
        <ul className="list-disc pl-4">
            <li>Building/room access may be restricted to specific colleges or departments</li>
            <li>Displayed availability only reflects official class schedules</li>
            <li>Rooms may be occupied by unofficial meetings or study groups</li>
            <li>Click on indicators to view room schedules for that building</li>
        </ul>
    </PopoverContent>
);
