"use client";
import React, { useRef, useEffect, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { EventData } from "@/lib/supabase";
import { formatTime } from "@/lib/utils";

interface MapProps {
    events: EventData[];
    userPos: [number, number] | null;
    selectedEvent: string | null;
    onEventSelect: (eventId: string) => void;
}

export default function Map({ events, userPos, selectedEvent, onEventSelect }: MapProps) {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const popupsRef = useRef<mapboxgl.Popup[]>([]);
    
    const [center, setCenter] = useState<[number, number]>([-76.9426, 38.9869]);

    const filteredEvents = events;

    useEffect(() => {
        if (userPos) {
            setCenter([userPos[1], userPos[0]]);
        }
    }, [userPos]);

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
        
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/sanjay07/cm7apwi2u005d01p7efst9xll",
            center: userPos ? [userPos[1], userPos[0]] : center,
            zoom,
            pitch,
            bearing: 45,
            antialias: true,
            maxBounds: [[-180, -90], [180, 90]]
        });

        map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }));

        map.on("style.load", () => {
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
        });

        // Clean up existing markers
        markersRef.current.forEach(marker => marker.remove());
        popupsRef.current.forEach(popup => popup.remove());
        markersRef.current = [];
        popupsRef.current = [];

        // Add markers for events
        filteredEvents.forEach((event) => {
            if (event.latitude && event.longitude) {
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

                const popup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    className: "shadow-lg",
                    offset: [0, -5]
                }).setHTML(createEventPopupHTML(event));

                const marker = new mapboxgl.Marker(el)
                    .setLngLat([event.longitude, event.latitude])
                    .setPopup(popup)
                    .addTo(map);

                el.addEventListener("mouseenter", () => popup.addTo(map));
                el.addEventListener("mouseleave", () => popup.remove());
                el.addEventListener("click", () => onEventSelect(event.id || ''));

                markersRef.current.push(marker);
                popupsRef.current.push(popup);
            }
        });

        // Add user location marker if available
        if (userPos) {
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
        }

        // When selecting a new event, fly to its location
        if (selectedEvent) {
            const event = events.find(e => e.id === selectedEvent);
            if (event?.latitude && event?.longitude) {
                map.flyTo({
                    center: [event.longitude, event.latitude],
                    zoom: selectedEvent ? 17 : 16.25,
                    duration: 1000
                });
            }
        } else {
            // When deselecting, return to original view if user location exists
            if (userPos) {
                map.flyTo({
                    center: [userPos[1], userPos[0]],
                    zoom: 16.25,
                    duration: 1000
                });
            }
        }

        mapRef.current = map;

        return () => {
            markersRef.current.forEach(marker => marker.remove());
            popupsRef.current.forEach(popup => popup.remove());
            map.remove();
        };
    }, [filteredEvents, mapboxToken, center, zoom, pitch, userPos, selectedEvent, onEventSelect]);

    return (
        <div className="h-full w-full relative">
            <div id="map-container" ref={mapContainerRef} className="rounded-3xl overflow-hidden shadow-lg h-full w-full" />
            
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

            {/* Simplified mobile legend showing just a hint - only visible on small screens */}
            <div className="absolute left-2 bottom-2 bg-black bg-opacity-70 rounded-lg p-1.5 md:hidden">
                <button 
                    className="flex items-center justify-center"
                    aria-label="Map legend information"
                    onClick={() => alert("Map Legend:\n• Blue Pin: Your Location\n• Red: Ongoing Events\n• Gray: Past Events\n• Green: Today's Upcoming\n• Purple: Future Events")}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
