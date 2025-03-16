import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string | null): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes}${ampm}`;
}

export function formatMonthDayYear(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function generateGoogleCalendarUrl(event: {
  title: string;
  description: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string;
}): string {
  const { title, description, date, startTime, endTime, location } = event;

  if (!date || !startTime || !endTime) {
    return '#';
  }

  try {
    // Format date and times to match Google Calendar format
    const formattedStartDate = date.replace(/-/g, '') + 'T' + startTime.replace(':', '') + '00';
    const formattedEndDate = date.replace(/-/g, '') + 'T' + endTime.replace(':', '') + '00';

    const baseUrl = 'https://www.google.com/calendar/event';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: encodeURIComponent(title),
      details: encodeURIComponent(description),
      location: encodeURIComponent(location),
      dates: `${formattedStartDate}/${formattedEndDate}`,
    }).toString();

    return `${baseUrl}?${params}`;
  } catch (error) {
    console.error('Error generating calendar URL:', error);
    return '#';
  }
}

export const resizeImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          }
        }, 'image/jpeg', 0.7);
      };
    };
  });
};
