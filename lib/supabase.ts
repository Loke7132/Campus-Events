import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type EventData = {
  id?: string;
  created_at?: string;
  title: string;
  description: string;
  email: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string;
  image_url: string;
  organizer_name: string;
  latitude?: number;
  longitude?: number;
  event_type: string | string[];
  max_participants: number;
  current_participants?: number;
  rsvp_link: string;
  password?: string;
};

export type RSVPData = {
  id?: string;
  created_at?: string;
  event_id: string;
  user_email: string;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};
