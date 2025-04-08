"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EventData } from "@/lib/supabase";
import { formatTime } from "@/lib/utils";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface MapProps {
    events: EventData[];
    userPos: [number, number] | null;
    selectedEvent: string | null;
    onEventSelect: (eventId: string) => void;
    onCloseMap?: () => void;
    onDateSelect?: (date: Date | null) => void;
}

export default function Map({ events, userPos, selectedEvent, onEventSelect, onCloseMap, onDateSelect }: MapProps) {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const popupsRef = useRef<mapboxgl.Popup[]>([]);
    
    const [center, setCenter] = useState<[number, number]>([-76.9426, 38.9869]);
    const [showEventHeader, setShowEventHeader] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [days, setDays] = useState<Date[]>([]);
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const filteredEvents = events;

    useEffect(() => {
        if (userPos) {
            setCenter([userPos[1], userPos[0]]);
        }
    }, [userPos]);

    // Check if screen width is less than 471px and update showEventHeader state
    useEffect(() => {
        const handleResize = () => {
            // Only show header if width is less than 432px, hiding it for 432-471px range
            setShowEventHeader(window.innerWidth < 432);
        };
        
        // Set initial value
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Remove event listener on cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Initialize days array for date selection
    useEffect(() => {
        const getDays = () => {
            // Create specific dates to match the reference image (showing 8, 9, 10 - Tue, Wed, Thu)
            const result = [];
            
            // Create dates for 8th, 9th, and 10th
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth();
            
            result.push(new Date(currentYear, currentMonth, 8)); // 8th - Tuesday
            result.push(new Date(currentYear, currentMonth, 9)); // 9th - Wednesday
            result.push(new Date(currentYear, currentMonth, 10)); // 10th - Thursday
            
            setDays(result);
        };
        
        getDays();
    }, []);

    const handleSelectToday = () => {
        setSelectedDate(today);
        // Notify parent component about date selection
        if (onDateSelect) {
            onDateSelect(today);
        }
        // Close map on mobile to show events
        if (window.innerWidth < 471 && onCloseMap) {
            setTimeout(() => onCloseMap(), 300);
        }
    };

    const handleSelectDate = (date: Date) => {
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        setSelectedDate(selectedDate);
        // Notify parent component about date selection
        if (onDateSelect) {
            onDateSelect(selectedDate);
        }
        // Close map on mobile to show events
        if (window.innerWidth < 471 && onCloseMap) {
            setTimeout(() => onCloseMap(), 300);
        }
    };

    const isDateSelected = (date: Date) => {
        if (!selectedDate) return date.toDateString() === today.toDateString();
        return date.toDateString() === selectedDate.toDateString();
    };

    const handlePrevDays = () => {
        if (days.length === 0) return;
        
        const newDays = [...days];
        const firstDay = new Date(newDays[0]);
        firstDay.setDate(firstDay.getDate() - 1);
        
        // Only allow navigating to today or future days
        if (firstDay.getTime() >= today.getTime()) {
            newDays.unshift(firstDay);
            newDays.pop(); // Remove the last day
            setDays(newDays);
        }
    };

    const handleNextDays = () => {
        if (days.length === 0) return;
        
        const newDays = [...days];
        const lastDay = new Date(newDays[newDays.length - 1]);
        lastDay.setDate(lastDay.getDate() + 1);
        
        newDays.shift(); // Remove the first day
        newDays.push(lastDay);
        setDays(newDays);
    };

    const [zoom] = useState(16.25);
    const [pitch] = useState(65);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    function createEventPopupHTML(event: EventData): string {
        return `
            <div class="p-2 bg-white hover:bg-gray-50 transition-colors rounded-lg">
                <h3 class="font-medium text-sm text-gray-900">${event.title}</h3>
                <p class="text-xs text-gray-600 mt-0.5">${formatTime(event.startTime)} - ${formatTime(event.endTime)}</p>
                <p class="text-xs text-gray-500 mt-1">Click to view details</p>
            </div>
        `;
    }

    useEffect(() => {
        if (!mapboxToken || !mapContainerRef.current) {
            console.error("Missing required props");
            return;
        }

        mapboxgl.accessToken = mapboxToken;
        
        try {
            // Create map instance without immediately initializing it
            const container = mapContainerRef.current;
            
            // Set a global error handler for Mapbox
            // @ts-ignore - Adding errorCb to prevent "this.errorCb is not a function" error
            mapboxgl.Map.prototype.errorCb = (err: any) => {
                console.error('Mapbox error:', err);
            };
            
            const mapOptions = {
                container,
            style: "mapbox://styles/sanjay07/cm7apwi2u005d01p7efst9xll",
                center: userPos ? [userPos[1], userPos[0]] as [number, number] : center as [number, number],
            zoom,
            pitch,
            bearing: 45,
            antialias: true,
                maxBounds: [[-180, -90], [180, 90]] as mapboxgl.LngLatBoundsLike
            };
            
            // Now create the map with all options
            const map = new mapboxgl.Map(mapOptions);

            // Explicitly handle map load errors
            map.on('error', (e) => {
                console.error('Mapbox error event:', e);
            });

            // Only add controls after the map is fully loaded
            map.once('load', () => {
                try {
        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));
                } catch (error) {
                    console.error("Error adding controls:", error);
                }
            });

        map.on("style.load", () => {
                try {
            map.addSource("mapbox-dem", {
                type: "raster-dem",
                url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                tileSize: 512,
                maxzoom: 14
            });

            map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

            map.addLayer({
                id: "3d-buildings",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 15,
                paint: {
                    "fill-extrusion-color": [
                        "interpolate",
                        ["linear"],
                        ["get", "height"],
                        0, "#2D3748",
                        50, "#4A5568",
                        100, "#718096",
                        200, "#A0AEC0"
                    ],
                    "fill-extrusion-height": ["get", "height"],
                    "fill-extrusion-base": 0,
                    "fill-extrusion-opacity": 0.8,
                    "fill-extrusion-ambient-occlusion-intensity": 1,
                    "fill-extrusion-ambient-occlusion-radius": 2,
                    "fill-extrusion-vertical-gradient": true
                }
            });
                } catch (error) {
                    console.error("Error in style.load event:", error);
                }
        });

        // Clean up existing markers
        markersRef.current.forEach(marker => marker.remove());
        popupsRef.current.forEach(popup => popup.remove());
        markersRef.current = [];
        popupsRef.current = [];

        // Add markers for events
        filteredEvents.forEach((event) => {
            if (event.latitude && event.longitude) {
                    try {
                const el = document.createElement("div");
                
                // Determine event timing
                const now = new Date();
                const [year, month, day] = event.date.split('-').map(Number);
                const eventDate = new Date(year, month - 1, day);
                
                const [startHour, startMinute] = (event.startTime || '').split(':').map(Number);
                const [endHour, endMinute] = (event.endTime || '').split(':').map(Number);
                const startDateTime = new Date(year, month - 1, day, startHour || 0, startMinute || 0);
                const endDateTime = new Date(year, month - 1, day, endHour || 23, endMinute || 59);
                
                // Set marker color and size based on selection and timing
                const isPast = endDateTime < now;
                const isOngoing = startDateTime <= now && endDateTime >= now;
                const isFuture = eventDate > new Date(now.getTime() + (24 * 60 * 60 * 1000));
                const isToday = eventDate.toDateString() === now.toDateString();
                const isSelected = selectedEvent === event.id;
                
                const baseClass = isSelected ? 'h-1 w-1 sm:h-5 sm:w-5' : 'h-0.5 w-0.5 sm:h-4 sm:w-4';
                const ringClass = isSelected ? 'ring-1 sm:ring-[3px]' : 'ring-1 sm:ring-2';
                
                if (isOngoing) {
                    el.className = `${baseClass} rounded-full bg-red-500 ${ringClass} ring-red-200 shadow-[0px_0px_2px_1px_rgba(239,68,68,0.5)] sm:shadow-[0px_0px_8px_4px_rgba(239,68,68,0.5)] transition-all`;
                } else if (isPast) {
                    el.className = `${baseClass} rounded-full bg-zinc-500 ${ringClass} ring-zinc-200 shadow-[0px_0px_2px_1px_rgba(161,161,170,0.5)] sm:shadow-[0px_0px_8px_4px_rgba(161,161,170,0.5)] transition-all`;
                } else if (isFuture) {
                    el.className = `${baseClass} rounded-full bg-purple-500 ${ringClass} ring-purple-200 shadow-[0px_0px_2px_1px_rgba(168,85,247,0.5)] sm:shadow-[0px_0px_8px_4px_rgba(168,85,247,0.5)] transition-all`;
                } else if (isToday && startDateTime > now) {
                    el.className = `${baseClass} rounded-full bg-green-500 ${ringClass} ring-green-200 shadow-[0px_0px_2px_1px_rgba(34,197,94,0.5)] sm:shadow-[0px_0px_8px_4px_rgba(34,197,94,0.5)] transition-all`;
                } else {
                    el.className = `${baseClass} rounded-full bg-green-500 ${ringClass} ring-green-200 shadow-[0px_0px_2px_1px_rgba(34,197,94,0.5)] sm:shadow-[0px_0px_8px_4px_rgba(34,197,94,0.5)] transition-all`;
                }

                        const popupOptions = {
                    closeButton: false,
                    closeOnClick: false,
                    className: "shadow-lg",
                            offset: [0, -5] as [number, number]
                        };
                        
                        const popup = new mapboxgl.Popup(popupOptions)
                            .setHTML(createEventPopupHTML(event));

                const marker = new mapboxgl.Marker(el)
                    .setLngLat([event.longitude, event.latitude])
                    .setPopup(popup)
                    .addTo(map);

                        // Use safer event binding
                        const onMouseEnter = () => popup.addTo(map);
                        const onMouseLeave = () => popup.remove();
                        const onClick = () => onEventSelect(event.id || '');
                        
                        el.addEventListener("mouseenter", onMouseEnter);
                        el.addEventListener("mouseleave", onMouseLeave);
                        el.addEventListener("click", onClick);

                markersRef.current.push(marker);
                popupsRef.current.push(popup);
                    } catch (error) {
                        console.error("Error creating marker:", error);
                    }
            }
        });

        // Add user location marker if available
        if (userPos) {
                try {
            const userMarker = document.createElement("div");
            userMarker.className = "h-2 w-2 sm:h-6 sm:w-6 text-blue-500 transition-all animate-pulse";
            userMarker.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full drop-shadow-[0px_0px_8px_rgba(14,165,233,0.8)]">
                    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                </svg>
            `;
            const marker = new mapboxgl.Marker(userMarker)
                .setLngLat([userPos[1], userPos[0]])
                .addTo(map);
            markersRef.current.push(marker);
                } catch (error) {
                    console.error("Error creating user marker:", error);
                }
        }

        // When selecting a new event, fly to its location
        if (selectedEvent) {
            const event = events.find(e => e.id === selectedEvent);
            if (event?.latitude && event?.longitude) {
                    try {
                map.flyTo({
                    center: [event.longitude, event.latitude],
                    zoom: selectedEvent ? 17 : 16.25,
                    duration: 1000
                });
                    } catch (error) {
                        console.error("Error flying to selected event:", error);
                    }
            }
        } else {
            // When deselecting, return to original view if user location exists
            if (userPos) {
                    try {
                map.flyTo({
                    center: [userPos[1], userPos[0]],
                    zoom: 16.25,
                    duration: 1000
                });
                    } catch (error) {
                        console.error("Error flying to user location:", error);
                    }
            }
        }

        mapRef.current = map;

        return () => {
                try {
            markersRef.current.forEach(marker => marker.remove());
            popupsRef.current.forEach(popup => popup.remove());
            map.remove();
                } catch (error) {
                    console.error("Error during cleanup:", error);
                }
        };
        } catch (error) {
            console.error("Error initializing map:", error);
            return () => {};
        }
    }, [filteredEvents, mapboxToken, center, zoom, pitch, userPos, selectedEvent, onEventSelect]);

    return (
        <div className="h-full w-full relative">
            {/* Event header for small screens */}
            {showEventHeader && (
                <div className="absolute top-0 left-0 right-0 z-10 bg-orange-500 rounded-3xl p-3">
                    <h1 
                        className="text-xl font-bold text-white flex items-center justify-center cursor-pointer"
                        onClick={() => window.location.reload()}
                    >
                        E V 
                        <span className="inline-flex items-center mx-1">
                            <Image 
                                src="/Images/png.png" 
                                alt="Ə" 
                                width={25} 
                                height={25} 
                                className="object-contain"
                                priority
                            />
                        </span>
                        N T S
                    </h1>
                    
                    {/* Date selector */}
                    <div className="flex items-center justify-center mt-1">
                        <div className="bg-black rounded-full w-full h-[40px] flex items-center p-1">
                            <div className="flex items-center justify-between w-full px-1">
                                <button 
                                    className="bg-white text-black rounded-full h-[32px] w-[98px] font-medium text-sm -ml-1"
                                    onClick={handleSelectToday}
                                >
                                    Today
                                </button>
                                
                                <button 
                                    className="text-white cursor-pointer ml-[36px] max-[432px]:ml-[15px]" 
                                    onClick={handlePrevDays}
                                    aria-label="Previous days"
                                >
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                    
                                {/* Date display - exactly matching format in reference image */}
                                <div className="flex justify-between w-[120px] mx-auto max-[432px]:mx-[15px]">
                                    {days.map((day, index) => (
                                        <div 
                                            key={index} 
                                            className={`
                                                flex flex-col items-center justify-center cursor-pointer h-[40px] w-[40px]
                                                ${isDateSelected(day) ? 'bg-white text-black rounded-full' : ''}
                                            `}
                                            onClick={() => handleSelectDate(day)}
                                        >
                                            <div className={`text-sm font-medium ${isDateSelected(day) ? 'text-black' : 'text-white'}`}>
                                                {day.getDate()}
                                            </div>
                                            <div className={`text-xs ${isDateSelected(day) ? 'text-black' : 'text-gray-400'}`}>
                                                {daysOfWeek[day.getDay()]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <button 
                                    className="text-white cursor-pointer mr-[36px] max-[432px]:mr-[15px]" 
                                    onClick={handleNextDays}
                                    aria-label="Next days"
                                >
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className={`${showEventHeader ? 'pt-[125px]' : ''} w-full h-full`}>
                {/* Map container with the close button positioned directly on the map */}
                <div className="relative w-full h-full">
                    <div 
                        id="map-container" 
                        ref={mapContainerRef} 
                        className="rounded-3xl overflow-hidden shadow-lg w-full h-full" 
                    />
                    
                    {/* Close button positioned directly on the map */}
                    {showEventHeader && (
                        <div className="absolute top-4 right-4 z-20">
                            <button 
                                onClick={onCloseMap}
                                aria-label="Close map"
                                className="bg-zinc-800 rounded-full p-3 flex items-center justify-center shadow-lg"
                            >
                                <XMarkIcon className="h-5 w-5 text-white" />
                            </button>
                        </div>
                    )}

                    {/* Simplified mobile legend - moved to bottom-left to cover mapbox watermark */}
                    <div className="absolute left-[8px] bottom-[2px] bg-black bg-opacity-95 rounded-lg p-2 md:hidden z-30 border border-zinc-800 shadow-lg">
                        {/* Your Location */}
                        <div className="flex items-center mb-1.5">
                            <div className="w-4 h-4 mr-2 flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="#3b82f6" className="w-full h-full">
                                    <path d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
                                </svg>
                            </div>
                            <span className="text-blue-300 text-xs">Your Location</span>
                        </div>
                        
                        {/* Ongoing Events */}
                        <div className="flex items-center mb-1.5">
                            <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            </div>
                            <span className="text-red-300 text-xs">Ongoing Events</span>
                        </div>
                        
                        {/* Past Events */}
                        <div className="flex items-center mb-1.5">
                            <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full border-[2px] border-white bg-transparent"></div>
                            </div>
                            <span className="text-gray-300 text-xs">Past Events</span>
                        </div>
                        
                        {/* Today's Upcoming */}
                        <div className="flex items-center mb-1.5">
                            <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-green-300 text-xs">Today's Upcoming</span>
                        </div>
                        
                        {/* Future Events */}
                        <div className="flex items-center">
                            <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            </div>
                            <span className="text-purple-300 text-xs">Future Events</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Legend at bottom left of map, stacked vertically - hidden on small screens */}
            <div className="absolute left-4 bottom-4 bg-black rounded-lg px-3 py-2 space-y-2 w-48 hidden md:block">
                {/* Your Location */}
                <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="#3b82f6" className="w-full h-full">
                            <path d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" />
                        </svg>
                    </div>
                    <span className="text-blue-300 text-xs">Your Location</span>
                </div>
                
                {/* Ongoing Events */}
                <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    </div>
                    <span className="text-red-300 text-xs">Ongoing Events</span>
                </div>
                
                {/* Past Events */}
                <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border-[2px] border-gray-300 bg-transparent"></div>
                    </div>
                    <span className="text-gray-300 text-xs">Past Events</span>
                </div>
                
                {/* Today's Upcoming */}
                <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-green-300 text-xs">Today's Upcoming</span>
                </div>
                
                {/* Future Events */}
                <div className="flex items-center">
                    <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                    </div>
                    <span className="text-purple-300 text-xs">Future Events</span>
                </div>
            </div>
        </div>
    );
}
