"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase, type Coordinates, type EventData } from "@/lib/supabase";
import { extractCoordinatesFromUrl } from "@/lib/googleMapsUtils";
import { resizeImage } from "@/lib/utils";

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

interface AddEventProps {
  onEventAdded: () => void;
  onFormVisibilityChange?: (isVisible: boolean) => void;
  editMode?: boolean;
  eventData?: EventData;
  onClose?: () => void;
}

export default function AddEvent({ onEventAdded, onFormVisibilityChange, editMode = false, eventData, onClose }: AddEventProps) {
  const [showForm, setShowForm] = useState(editMode);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    editMode && eventData ? eventData.image_url : null
  );
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<EventFormData>({
    defaultValues: editMode && eventData ? {
      title: eventData.title,
      description: eventData.description,
      email: eventData.email,
      date: eventData.date,
      startTime: eventData.startTime || '',
      endTime: eventData.endTime || '',
      location: eventData.location,
      organizerName: eventData.organizer_name,
      event_type: eventData.event_type as Array<'Study Group' | 'Social' | 'Sports' | 'Academic' | 'Other'>,
      max_participants: eventData.max_participants,
      rsvp_link: eventData.rsvp_link,
      password: eventData.password
    } : undefined
  });

  // Watch for image changes
  const imageFile = watch("image");
  useEffect(() => {
    if (imageFile?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile[0]);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  useEffect(() => {
    onFormVisibilityChange?.(showForm);
  }, [showForm, onFormVisibilityChange]);

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showForm]);

  const validateEmail = (email: string) => {
    return email.endsWith('.edu') || "Only .edu email addresses are allowed";
  };

  const clearImage = () => {
    setValue('image', undefined as unknown as FileList);
    setImagePreview(null);
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = '';
      
      // Only process image if an image was selected
      if (data.image?.[0]) {
        const resizedImage = await resizeImage(data.image[0]);
        
        // Sanitize filename by removing spaces and special characters
        const sanitizedName = resizedImage.name
          .replace(/[^a-zA-Z0-9.]/g, '_') // Replace non-alphanumeric chars with underscore
          .replace(/__+/g, '_'); // Replace multiple underscores with a single one
        
        const imageName = `${Date.now()}-${sanitizedName}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('event-images')
          .upload(imageName, resizedImage);

        if (uploadError) {
          console.error('Upload Error:', uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(imageName);

        imageUrl = urlData?.publicUrl;
        if (!imageUrl) {
          throw new Error('Failed to get public URL');
        }
      }

      const formattedDate = data.date;
      
      // Ensure startTime and endTime are formatted correctly for "time without time zone" type
      const startTime = data.startTime;
      const endTime = data.endTime;
      
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
      if (!coordinatesData || (!coordinatesData.latitude && !coordinatesData.longitude)) {
        console.warn('Could not extract coordinates from location URL:', data.location);
      }
      
      if (editMode && eventData?.id) {
        const { error: updateError } = await supabase
          .from('events')
          .update({
            title: data.title,
            description: data.description,
            email: data.email,
            date: formattedDate,
            startTime: startTime,
            endTime: endTime,
            location: data.location,
            ...(data.image?.[0] ? { image_url: imageUrl } : {}), // Only update image_url if new image
            organizer_name: data.organizerName,
            event_type: data.event_type, // Should already be an array from the form
            max_participants: maxParticipants,
            rsvp_link: data.rsvp_link,
            password: data.password,
            ...coordinatesData
          })
          .eq('id', eventData.id);

        if (updateError) throw updateError;
      } else {
        // Create event with or without image
        const newEventData = {
          title: data.title,
          description: data.description,
          email: data.email,
          date: formattedDate,
          startTime: startTime,
          endTime: endTime,
          location: data.location,
          image_url: imageUrl, // No default value - let DB handle null values
          organizer_name: data.organizerName,
          event_type: data.event_type, // Already an array
          max_participants: maxParticipants,
          current_participants: 0,
          rsvp_link: data.rsvp_link,
          password: data.password,
          ...coordinatesData
        };
        
        console.log('Creating new event with data:', newEventData);
        
        const { error: insertError } = await supabase
          .from('events')
          .insert(newEventData);

        if (insertError) {
          console.error('Insert Error:', insertError);
          throw insertError;
        }
      }

      onEventAdded();
      if (editMode && onClose) {
        onClose();
      } else {
        setShowForm(false);
      }
      reset();
      setImagePreview(null);
    } catch (error) {
      console.error('Full error details:', error);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'An unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for specific Supabase errors
      if (typeof error === 'object' && error !== null) {
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
          
          // Provide more user-friendly messages for common errors
          if (errorMessage.includes('InvalidKey')) {
            errorMessage = 'Invalid file name. Please rename your file and try again.';
          } else if (errorMessage.includes('Permission denied')) {
            errorMessage = 'You do not have permission to upload files.';
          } else if (errorMessage.includes('violates foreign key constraint')) {
            errorMessage = 'Unable to save event due to database constraints.';
          }
        }
      }
      
      alert(`Failed to create event: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="z-10">
      {!editMode && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[500]">
          <div className="fixed right-0 top-0 h-full w-[94%] sm:w-[500px] bg-zinc-900 overflow-y-auto">
            <div className="sticky top-0 z-10 flex justify-between items-center p-4 sm:p-6 bg-zinc-900 border-b border-zinc-800">
              <h2 className="text-base sm:text-lg font-semibold text-white">Add New Event</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Event Title</label>
                  <input
                    {...register("title", { 
                      required: "Title is required",
                      maxLength: { value: 60, message: "Title must be less than 60 characters" }
                    })}
                    placeholder="e.g., Math Study Group Session"
                    className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-zinc-500"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.title && <p className="text-red-500 text-xs sm:text-sm">{errors.title.message}</p>}
                    <span className="text-zinc-400 text-xs">{watch("title")?.length || 0}/60</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Description</label>
                  <textarea
                    {...register("description", { 
                      required: "Description is required",
                      maxLength: { value: 250, message: "Description must be less than 250 characters" }
                    })}
                    placeholder="e.g., Join us for a collaborative study session covering calculus topics..."
                    className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500 h-24 resize-none placeholder:text-zinc-500"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && <p className="text-red-500 text-xs sm:text-sm">{errors.description.message}</p>}
                    <span className="text-zinc-400 text-xs">{watch("description")?.length || 0}/250</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Event Type</label>
                  <div className="space-y-2 bg-zinc-800 rounded-lg px-3 sm:px-4 py-2">
                    {['Study Group', 'Social', 'Sports', 'Academic', 'Other'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={type}
                          {...register("event_type", { 
                            required: "Please select at least one event type"
                          })}
                          className="rounded bg-zinc-700 border-zinc-600 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm text-white">{type}</span>
                      </label>
                    ))}
                  </div>
                  {errors.event_type && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.event_type.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Max Participants</label>
                  <input
                    type="number"
                    min="1"
                    {...register("max_participants", { 
                      required: "Max participants is required",
                      min: { value: 1, message: "Must be at least 1" }
                    })}
                    placeholder="e.g., 20"
                    className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {errors.max_participants && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.max_participants.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Date</label>
                    <input
                      type="date"
                      min={new Date().toLocaleDateString('en-CA')}
                      {...register("date", { required: "Date is required" })}
                      className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    {errors.date && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        {...register("startTime", { required: "Start time required" })}
                        className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <input
                        type="time"
                        {...register("endTime", { required: "End time required" })}
                        className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    {(errors.startTime || errors.endTime) && (
                      <p className="text-red-500 text-xs sm:text-sm mt-1">
                        {errors.startTime?.message || errors.endTime?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Location URL</label>
                  <input
                    {...register("location", { required: "Location URL is required" })}
                    placeholder="e.g., https://goo.gl/maps/..."
                    className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {errors.location && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.location.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">RSVP Link</label>
                  <input
                    {...register("rsvp_link", { required: "RSVP link is required" })}
                    placeholder="e.g., https://forms.google.com/..."
                    className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {errors.rsvp_link && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.rsvp_link.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Organizer Email (.edu)</label>
                  <input
                    type="email"
                    {...register("email", { 
                      required: "Email is required",
                      validate: validateEmail
                    })}
                    placeholder="e.g., student@university.edu"
                    className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {errors.email && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Organizer Name</label>
                  <input
                    {...register("organizerName", { required: "Organizer name is required" })}
                    placeholder="e.g., John Doe"
                    className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {errors.organizerName && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.organizerName.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Event Password</label>
                  <input
                    type="password"
                    {...register("password", { 
                      required: "Password is required",
                      minLength: { value: 6, message: "Password must be at least 6 characters" }
                    })}
                    placeholder="Enter a password to protect your event"
                    className="w-full bg-zinc-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  {errors.password && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-zinc-400 mb-1">Event Image</label>
                  <div className="mt-1 flex justify-center px-4 py-6 border-2 border-zinc-700 border-dashed rounded-lg hover:border-zinc-500 transition-colors">
                    <div className="space-y-2 text-center">
                      {imagePreview ? (
                        <div className="space-y-3">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="max-h-32 mx-auto rounded-lg object-contain"
                          />
                          <p className="text-xs text-zinc-400 truncate max-w-[200px] mx-auto">
                            {imageFile?.[0]?.name}
                          </p>
                          <button
                            type="button"
                            onClick={clearImage}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-zinc-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-zinc-400">
                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-red-500 hover:text-red-400 focus-within:outline-none">
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                {...register("image")}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-zinc-500">PNG, JPG, GIF up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                  {errors.image && <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.image.message?.toString()}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 sm:gap-3 mt-6 pt-4 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editMode ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    editMode ? 'Save Changes' : 'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
