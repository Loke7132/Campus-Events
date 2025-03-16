# Campus Events Platform

A modern web application designed to connect students with events happening on their campus. This platform allows users to discover, create, and manage events, making campus life more engaging and accessible.

![Events Platform](public/Images/png.png)

## Features

- **Event Discovery**: Browse all campus events in a clean, intuitive interface
- **Event Creation**: Host your own events with a comprehensive form that includes:
  - Event details (title, description, date, time)
  - Location integration with Google Maps
  - Image upload with cropping functionality
  - Event categorization (Study Group, Social, Sports, Academic, Other)
- **Event Filtering**: Filter events by type and search for specific events
- **Date Navigation**: Browse events by date with an intuitive calendar interface
- **Responsive Design**: Fully responsive interface that works on mobile and desktop
- **Event Cards**: Visually appealing cards displaying event information
- **.edu Email Verification**: Ensures that event organizers are part of the campus community

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form for validation and submission
- **Database**: Supabase
- **Image Processing**: React Image Crop
- **Authentication**: Email-based authentication
- **Icons**: Heroicons

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account (for backend services)

### Installation

1. Clone the repository:
   ```
   git clone [repository-url]
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### Browsing Events

- The main interface displays event cards with relevant information
- Use the date selector to view events on specific dates
- Filter events by type using the filter button
- Search for specific events using the search bar

### Creating an Event

1. Click the "Add event" button
2. Fill out the event details:
   - Title and description
   - Your .edu email address and name
   - Event date and time
   - Location (Google Maps URL)
   - Event type(s)
   - Maximum number of participants
   - Optional RSVP link
   - Password (for future edits)
3. Upload and crop an image for your event
4. Submit the form to create your event

### Event Management

- Events can be edited by the creator using the provided password
- Click on an event to view more details

## Project Structure

```
frontend/
├── app/                   # Next.js app directory
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── Events.tsx         # Main events component
│   ├── Events/            # Event-related components
│   │   └── EventCard.tsx  # Event card component
│   ├── AddEvent.tsx       # Event creation component
│   └── ui/                # UI components
├── lib/                   # Utility functions
│   ├── supabase.ts        # Supabase client and types
│   ├── googleMapsUtils.ts # Google Maps utilities
│   └── utils.ts           # General utilities
├── public/                # Static assets
│   └── Images/            # Image assets
└── styles/                # Global styles
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the Supabase team for providing an excellent backend service
- Icon assets provided by Heroicons
