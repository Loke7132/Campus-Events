"use client";

import { type EventData } from "@/lib/supabase";
import { EventCard } from "./Events/EventCard";
import { useState, useRef, useEffect, useCallback } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { FunnelIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AddEvent from "./AddEvent";
import { useForm } from "react-hook-form";
import { supabase, type Coordinates } from "@/lib/supabase";
import { extractCoordinatesFromUrl } from "@/lib/googleMapsUtils";
import { resizeImage } from "@/lib/utils";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Image from 'next/image';

interface EventsProps {
  events: EventData[];
  selectedEvent: string | null;
  onEventSelect: (eventId: string) => void;
  onEventAdded: () => void;
  onEventUpdated?: () => void;
  onDateSelect?: (date: Date | null) => void;
}

export default function Events({ events, selectedEvent, onEventSelect, onEventAdded, onEventUpdated, onDateSelect }: EventsProps) {
  const eventTypes = ['Study Group', 'Social', 'Sports', 'Academic', 'Other'];
  
  const [allSelected, setAllSelected] = useState<boolean>(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(eventTypes);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedEventRef = useRef<HTMLDivElement | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCustomAddEvent, setShowCustomAddEvent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState<Crop>({ 
    unit: '%', 
    width: 80,  // Start with 80% of image width
    height: 57, // For 1:1.4 aspect ratio (80 / 1.4)
    x: 10,      // Centered horizontally
    y: 20       // A bit higher than center vertically for faces
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  
  // Initialize selectedDay to today
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for consistent comparison
  
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  // Ensure currentStartDay is never before today
  const [currentStartDay, setCurrentStartDay] = useState<Date>(today);

  // Form for adding events
  interface EventFormData {
    title: string;
    description: string;
    email: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    image: FileList;
    organizerName: string;
    event_type: Array<'Study Group' | 'Social' | 'Sports' | 'Academic' | 'Other'>;
    max_participants: number;
    rsvp_link: string;
    password: string;
  }
  
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<EventFormData>();
  
  // Watch for image changes
  const imageFile = watch("image");
  
  useEffect(() => {
    if (imageFile?.[0]) {
      const file = imageFile[0];
      setOriginalFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        
        // Reset crop to a centered position with reasonable dimensions
        // This makes it more obvious to users that they need to adjust the crop
        setCrop({
          unit: '%',
          width: 80,  // Start with 80% of image width
          height: 57, // For 1:1.4 aspect ratio (80 / 1.4)
          x: 10,      // Centered horizontally
          y: 20       // A bit higher than center vertically for faces
        });
        
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
      
      // Clear the form field as we'll handle the file separately
      setValue('image', undefined as unknown as FileList);
    }
  }, [imageFile, setValue]);
  
  const clearImage = () => {
    setValue('image', undefined as unknown as FileList);
    setImagePreview(null);
    setCroppedImageUrl(null);
    setShowCropper(false);
    setOriginalFile(null);
  };
  
  const validateEmail = (email: string) => {
    return email.endsWith('.edu') || "Only .edu email addresses are allowed";
  };
  
  // Generate a cropped image from the selected portion
  const getCroppedImg = useCallback(async () => {
    if (!imageRef.current || !completedCrop || !originalFile) {
      return;
    }
    
    const image = imageRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return;
    }
    
    // Set canvas dimensions to the actual output size in original image pixels
    // This ensures we maintain the original image resolution in the cropped area
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    // Convert canvas to blob with high quality
    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob || !originalFile) {
          reject(new Error('Failed to create blob'));
          return;
        }
        
        // Create a File object from the blob
        const croppedFile = new File([blob], originalFile.name, {
          type: originalFile.type,
          lastModified: Date.now(),
        });
        
        // Update the preview URL for display
        const reader = new FileReader();
        reader.onloadend = () => {
          setCroppedImageUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
        
        resolve(croppedFile);
      }, originalFile.type, 0.95); // Set quality to 95% (0.95) for JPEG images
    });
  }, [completedCrop, originalFile]);
  
  // Handle crop completion
  const handleCropComplete = useCallback((crop: Crop) => {
    setCompletedCrop(crop);
  }, []);
  
  // Handle confirming crop
  const handleCropConfirm = useCallback(async () => {
    try {
      const croppedFile = await getCroppedImg();
      if (croppedFile) {
        // Store the cropped file to be used during form submission
        setOriginalFile(croppedFile);
        setShowCropper(false);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [getCroppedImg]);
  
  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = '';
      
      // Use the cropped image file if available
      if (originalFile) {
        // Skip resizing if the image is already cropped to the right dimensions
        // This prevents double processing and quality loss
        const imageName = `${Date.now()}-${originalFile.name
          .replace(/[^a-zA-Z0-9.]/g, '_')
          .replace(/__+/g, '_')}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('event-images')
          .upload(imageName, originalFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(imageName);

        imageUrl = urlData?.publicUrl || '';
      }

      // Validate event_type is an array
      if (!Array.isArray(data.event_type) || data.event_type.length === 0) {
        throw new Error('Please select at least one event type');
      }
      
      // Validate max_participants is a number
      const maxParticipants = parseInt(data.max_participants.toString(), 10);
      if (isNaN(maxParticipants) || maxParticipants <= 0) {
        throw new Error('Max participants must be a positive number');
      }
      
      // Build coordinates data
      const coordinatesData = extractCoordinatesFromUrl(data.location);
      
      // Create event with or without image
      const newEventData = {
        title: data.title,
        description: data.description,
        email: data.email,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        image_url: imageUrl,
        organizer_name: data.organizerName,
        event_type: data.event_type,
        max_participants: maxParticipants,
        current_participants: 0,
        rsvp_link: data.rsvp_link,
        password: data.password,
        ...coordinatesData
      };
      
      const { error: insertError } = await supabase
        .from('events')
        .insert(newEventData);

      if (insertError) {
        throw insertError;
      }

      onEventAdded();
      setShowCustomAddEvent(false);
      reset();
      setImagePreview(null);
      setCroppedImageUrl(null);
      setOriginalFile(null);
      setShowCropper(false);
    } catch (error) {
      console.error('Error adding event:', error);
      let errorMessage = 'An unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`Failed to create event: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting today
  const handleSelectToday = () => {
    setSelectedDay(today);
    if (onDateSelect) {
      onDateSelect(today);
    }
  };

  // Handle selecting a specific date
  const handleSelectDate = (date: Date) => {
    // Only allow selecting current or future dates
    if (date >= today) {
      setSelectedDay(date);
      if (onDateSelect) {
        onDateSelect(date);
      }
    }
  };

  // Generate days starting from tomorrow, not today
  const getDays = () => {
    const days = [];
    
    // Create tomorrow's date as the starting point if we're at today
    let startDate = new Date(currentStartDay);
    if (currentStartDay.getTime() === today.getTime()) {
      startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
    }

    // Get number of days to show based on screen width
    const getDaysToShow = () => {
      if (typeof window === 'undefined') return 3;
      const width = window.innerWidth;
      if (width >= 1024) return 3;
      if (width >= 768 && width < 1024) return 15;
      if (width > 640 && width <= 768) return 6;
      if ( width < 640) return 3;
      return 2;
    };
    
    const daysToShow = getDaysToShow();
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const days = getDays();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Check if a date is selected
  const isDateSelected = (date: Date) => {
    return date.toDateString() === selectedDay.toDateString();
  };

  // Handle moving to previous/next set of days
  const handlePrevDays = () => {
    // If currentStartDay is tomorrow, we can't go back further
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (currentStartDay.getTime() <= tomorrow.getTime()) {
      setCurrentStartDay(today); // Stay at today (which shows dates from tomorrow)
    } else {
      const newStartDay = new Date(currentStartDay);
      const daysToMove = getDays().length;
      newStartDay.setDate(currentStartDay.getDate() - daysToMove);
      
      // Ensure we don't go earlier than today
      if (newStartDay < today) {
        setCurrentStartDay(today);
      } else {
        setCurrentStartDay(newStartDay);
      }
    }
  };

  const handleNextDays = () => {
    const newStartDay = new Date(currentStartDay);
    const daysToMove = getDays().length;
    newStartDay.setDate(currentStartDay.getDate() + daysToMove);
    setCurrentStartDay(newStartDay);
  };

  const handleTypeToggle = (type: string) => {
    if (type === 'All') {
      // Toggle the "All" option independently
      const newAllSelected = !allSelected;
      setAllSelected(newAllSelected);
      
      // If turning "All" on, use it exclusively for filtering
      if (newAllSelected) {
        setSelectedTypes(eventTypes);
      } else {
        // When turning "All" off, don't select any types by default
      setSelectedTypes([]);
      }
      return;
    }
    
    // For other types, handle normally but also update "All" state
    setSelectedTypes(prev => {
      let newSelectedTypes;
      if (prev.includes(type)) {
        // Removing a type - allow empty selection
        newSelectedTypes = prev.filter(t => t !== type);
      } else {
        // Adding a type
        newSelectedTypes = [...prev, type];
      }
      
      // Update "All" state based on whether all types are selected
      setAllSelected(newSelectedTypes.length === eventTypes.length);
      
      return newSelectedTypes;
    });
  };

  // Update the filtering logic to handle empty type selection
  const filteredEvents = events
    .filter(event => {
      // If "All" is selected, show all events
      if (allSelected) {
        return true;
      }
      
      // If no types are selected, show no events
      if (selectedTypes.length === 0) {
        return false;
      }
      
      // Otherwise filter by selected types
      if (Array.isArray(event.event_type)) {
        return event.event_type.some(type => selectedTypes.includes(type));
      } else {
        return selectedTypes.includes(event.event_type as string);
      }
    })
    .filter(event => {
      // Filter by search term if any
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        return (
          event.title?.toLowerCase().includes(term) || 
          event.description?.toLowerCase().includes(term) ||
          event.location?.toLowerCase().includes(term)
        );
      }
      return true;
    });

  useEffect(() => {
    if (selectedEvent && selectedEventRef.current) {
      selectedEventRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedEvent]);

  const [searchPlaceholder, setSearchPlaceholder] = useState("Search events...");
  
  // Adjust search placeholder based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1024 && window.innerWidth <= 1635) {
          setSearchPlaceholder("Search...");
        } else {
          setSearchPlaceholder("Search events...");
        }
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3">
      {/* Orange header with logo image */}
      <div className="bg-orange-500 rounded-3xl p-3 sm:p-5 flex-shrink-0 w-full sm:w-full md:w-full lg:w-[440px] h-auto lg:h-[115px]">
        <h1 
          className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center md:justify-start cursor-pointer"
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
        <div className="flex items-center justify-center md:justify-start mt-1 sm:mt-2">
          <div className="bg-black rounded-full w-full max-w-full h-[40px] flex items-center p-1">
            <div className="flex items-center justify-between w-full px-1">
              <button 
                className={`${isDateSelected(today) ? 'bg-white text-black' : 'bg-transparent text-white'} rounded-full h-[32px] w-[98px] font-medium text-sm -ml-1`}
                onClick={handleSelectToday}
              >
                Today
              </button>
              
              <button 
                className="text-white cursor-pointer ml-[36px] sm:ml-[36px]" 
                onClick={handlePrevDays}
                aria-label="Previous days"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
                
              {/* Date display */}
              <div className="flex justify-between w-[120px] sm:w-[420px] md:w-[620px] lg:w-[120px] mx-auto">
                {days.map((day, index) => (
                  <div 
                    key={index} 
                    className={`
                      flex flex-col items-center justify-center cursor-pointer h-[40px] w-[40px]
                      ${isDateSelected(day) ? 'bg-white text-black rounded-full' : ''}
                    `}
                    onClick={() => day >= today && handleSelectDate(day)}
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
                className="text-white cursor-pointer mr-[36px] sm:mr-[36px]" 
                onClick={handleNextDays}
                aria-label="Next days"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events container */}
      <div className="bg-zinc-900 rounded-3xl flex-1 overflow-hidden flex flex-col w-full sm:w-full md:w-full lg:w-[440px] h-auto lg:h-[799px]">
        {/* Events header with filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start p-3 sm:p-4 gap-2 sm:gap-0 flex-shrink-0">
          <div className="flex items-center justify-between sm:justify-between w-full max-w-full md:max-w-full lg:w-[440px]">
            <div className="flex items-center gap-10 md:gap-6 max-[390px]:mr-1">
              {/* Search box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[157px] h-[39px] max-[450px]:w-[120px] max-[450px]:h-[40px] max-[450px]:text-xs max-[450px]:py-1.5 bg-zinc-800 text-white text-sm rounded-full pl-8 pr-3 py-2 placeholder-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <MagnifyingGlassIcon
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 lg:px-3 xl:px-3 2xl:px-4 py-1.5 sm:py-2 rounded-full bg-orange-500 h-[32px] sm:h-[38px] lg:h-[40px] max-[450px]:h-[40px] max-[450px]:px-1.5 flex-shrink-0"
                    onClick={() => setFilterOpen(!filterOpen)}
                  >
                    <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" /> 
                    <ChevronDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white hidden sm:block" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-zinc-800 border-zinc-700" align="end">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center space-x-2 cursor-pointer border-b border-zinc-700 pb-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => handleTypeToggle('All')}
                        className="rounded bg-zinc-700 border-zinc-600 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-white">All</span>
                    </label>
                    {eventTypes.map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeToggle(type)}
                          className="rounded bg-zinc-700 border-zinc-600 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-white">{type}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Button to open the Add Event modal */}
            <button 
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-500 rounded-full h-[40px] max-[450px]:h-[40px] max-[450px]:px-2 flex-shrink-0 whitespace-nowrap"
              onClick={() => setShowCustomAddEvent(true)}
            >
              <PlusIcon className="w-5 h-5 max-[450px]:w-4 max-[450px]:h-4 text-white" />
              <span className="text-white font-medium text-sm max-[450px]:text-xs">Add Events</span>
            </button>
          </div>
        </div>
        
        {/* Events list area */}
        <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar">
          <div className="w-full md:w-full lg:w-[399px] px-3 sm:px-4 md:px-0 md:ml-4">
            {showCustomAddEvent ? (
              <div className="bg-zinc-800 rounded-xl mb-4 overflow-y-auto">
                <div className="flex justify-between items-center p-3 border-b border-zinc-700 sticky top-0 bg-zinc-800 z-10">
                  <h3 className="text-lg font-semibold text-white">Add New Event</h3>
                  <button 
                    onClick={() => setShowCustomAddEvent(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Custom add event form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Event Title</label>
                      <input
                        {...register("title", { 
                          required: "Title is required",
                          maxLength: { value: 60, message: "Title must be less than 60 characters" }
                        })}
                        placeholder="e.g., Math Study Group Session"
                        className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                    </div>
                    
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                      <textarea
                        {...register("description", { 
                          required: "Description is required", 
                          maxLength: { value: 250, message: "Description must be less than 250 characters" }
                        })}
                        placeholder="Describe your event..."
                        rows={3}
                        className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Email (.edu required)</label>
                      <input
                        type="email"
                        {...register("email", { 
                          required: "Email is required",
                          validate: validateEmail
                        })}
                        placeholder="your.email@university.edu"
                        className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    {/* Organizer Name */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Organizer Name</label>
                      <input
                        {...register("organizerName", { required: "Organizer name is required" })}
                        placeholder="Your name"
                        className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {errors.organizerName && <p className="text-red-500 text-xs mt-1">{errors.organizerName.message}</p>}
                    </div>
                    
                    {/* Event date and time */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
                        <input
                          type="date"
                          {...register("date", { required: "Date is required" })}
                          className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Start Time</label>
                        <input
                          type="time"
                          {...register("startTime", { required: "Start time is required" })}
                          className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">End Time</label>
                        <input
                          type="time"
                          {...register("endTime", { required: "End time is required" })}
                          className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Location (Google Maps URL)</label>
                      <input
                        {...register("location", { required: "Location is required" })}
                        placeholder="https://maps.google.com/..."
                        className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                    </div>

                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Event Type</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {eventTypes.map((type) => (
                          <label key={type} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value={type}
                              {...register("event_type", { required: "Select at least one event type" })}
                              className="rounded bg-zinc-700 border-zinc-600 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-white">{type}</span>
                          </label>
                        ))}
                      </div>
                      {errors.event_type && <p className="text-red-500 text-xs mt-1">{errors.event_type.message}</p>}
                    </div>

                    {/* Max Participants */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Max Participants</label>
                      <input
                        type="number"
                        {...register("max_participants", { 
                          required: "Max participants is required",
                          min: { value: 1, message: "Must be at least 1" }
                        })}
                        placeholder="10"
                        className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {errors.max_participants && <p className="text-red-500 text-xs mt-1">{errors.max_participants.message}</p>}
                    </div>

                    {/* RSVP Link */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">RSVP Link (Optional)</label>
                      <input
                        {...register("rsvp_link")}
                        placeholder="https://..."
                        className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {errors.rsvp_link && <p className="text-red-500 text-xs mt-1">{errors.rsvp_link.message}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Password (for editing event)</label>
                      <input
                        type="password"
                        {...register("password", { required: "Password is required" })}
                        className="w-full bg-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1">Event Image</label>
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          {...register("image")}
                          className="text-sm text-zinc-400 w-full sm:w-auto file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                        />
                        {(imagePreview || croppedImageUrl) && (
                          <button
                            type="button"
                            onClick={clearImage}
                            className="text-zinc-400 hover:text-white"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      
                      {/* Image cropper */}
                      {showCropper && imagePreview && (
                        <div className="mt-4 border border-zinc-700 rounded-lg p-3 sm:p-4">
                          <h4 className="text-white text-sm font-medium mb-2">Crop Image (1:1.4 ratio)</h4>
                          <div className="flex flex-col gap-4">
                            <div className="relative flex-1">
                              <ReactCrop
                                crop={crop}
                                onChange={(c: Crop) => setCrop(c)}
                                onComplete={handleCropComplete}
                                aspect={1 / 1.4}
                                className="max-w-full"
                              >
                                <img 
                                  ref={imageRef}
                                  src={imagePreview} 
                                  alt="Preview" 
                                  className="max-w-full"
                                />
                              </ReactCrop>
                              
                              {/* Grid overlay */}
                              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                                <div className="border-r border-b border-white/30"></div>
                                <div className="border-r border-b border-white/30"></div>
                                <div className="border-b border-white/30"></div>
                                <div className="border-r border-b border-white/30"></div>
                                <div className="border-r border-b border-white/30"></div>
                                <div className="border-b border-white/30"></div>
                                <div className="border-r border-white/30"></div>
                                <div className="border-r border-white/30"></div>
                                <div></div>
                              </div>
                            </div>
                            
                            {/* Live Event Card Preview */}
                            <div className="w-full">
                              <h5 className="text-white text-sm font-medium mb-2">Event Card Preview</h5>
                              <div className="bg-zinc-800 rounded-xl overflow-hidden shadow-md max-w-md mx-auto">
                                {/* Mimics the image portion of the EventCard */}
                                {completedCrop && (
                                  <div className="relative h-36 w-full bg-zinc-700">
                                    <canvas
                                      ref={(canvasRef) => {
                                        if (canvasRef && imageRef.current && completedCrop) {
                                          const ctx = canvasRef.getContext('2d');
                                          if (ctx) {
                                            const image = imageRef.current;
                                            const scaleX = image.naturalWidth / image.width;
                                            const scaleY = image.naturalHeight / image.height;
                                            
                                            // Set canvas to match preview container dimensions but maintain aspect ratio
                                            canvasRef.width = canvasRef.parentElement?.clientWidth || completedCrop.width;
                                            canvasRef.height = canvasRef.parentElement?.clientHeight || completedCrop.height;
                                            
                                            // Enable image smoothing for better quality
                                            ctx.imageSmoothingEnabled = true;
                                            ctx.imageSmoothingQuality = 'high';
                                            
                                            // Clear the canvas before drawing
                                            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
                                            
                                            ctx.drawImage(
                                              image,
                                              completedCrop.x * scaleX,
                                              completedCrop.y * scaleY,
                                              completedCrop.width * scaleX,
                                              completedCrop.height * scaleY,
                                              0,
                                              0,
                                              canvasRef.width,
                                              canvasRef.height
                                            );
                                          }
                                        }
                                      }}
                                      className="absolute inset-0 w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                
                                {/* Dummy content to mimic event card layout */}
                                <div className="p-3">
                                  <div className="h-4 w-3/4 bg-zinc-700 rounded mb-2"></div>
                                  <div className="h-3 w-1/2 bg-zinc-700 rounded mb-3"></div>
                                  <div className="flex justify-between">
                                    <div className="h-6 w-16 bg-zinc-700 rounded"></div>
                                    <div className="h-6 w-6 bg-zinc-700 rounded-full"></div>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-zinc-400 mt-2">
                                This is how your image will appear in the event card.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end mt-4">
                            <button
                              type="button"
                              onClick={handleCropConfirm}
                              className="px-3 py-1 bg-orange-500 text-white rounded-md text-sm"
                            >
                              Confirm Crop
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Display cropped image preview */}
                      {!showCropper && croppedImageUrl && (
                        <div className="mt-2">
                          <img src={croppedImageUrl} alt="Preview" className="w-full max-w-xs h-auto object-cover rounded-lg" />
                        </div>
                      )}
                    </div>
                    
                    {/* Submit button */}
                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium transition-colors"
                      >
                        {isLoading ? 'Creating...' : 'Create Event'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map(event => (
                  <div 
                    key={event.id}
                    id={`event-${event.id}`}
                    ref={event.id === selectedEvent ? selectedEventRef : null}
                    className="w-full"
                  >
                    <EventCard 
                      event={event} 
                      isSelected={selectedEvent === event.id}
                      onClick={() => onEventSelect(event.id || '')}
                      onEdit={() => {
                        if (onEventUpdated) {
                          onEventUpdated();
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
