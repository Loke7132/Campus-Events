import Calendar from "../Calendar";
import { CalendarProps } from "../Calendar/types";

interface HeaderProps extends Pick<CalendarProps, 'onDateSelect' | 'selectedDate'> {}

export const Header = ({ onDateSelect, selectedDate }: HeaderProps) => (
    <div className="w-full flex flex-col">
        <div className="w-full px-5 py-4 bg-orange-500 rounded-3xl shadow-lg mt-[54px] mb-[22px] h-[116px]">
            <h1 className="text-2xl font-bold text-white mb-3 tracking-wide">
                E V<span className="inline-block transform rotate-12">⚡</span>NTS
            </h1>
            <div className="flex justify-center">
                <div className="bg-black rounded-full p-1 shadow-md w-full max-w-[398px] h-[40px]">
                    <Calendar onDateSelect={onDateSelect} selectedDate={selectedDate} />
                </div>
            </div>
        </div>
    </div>
);
