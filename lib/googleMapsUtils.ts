export function extractCoordinatesFromUrl(url: string): { latitude: number; longitude: number } | null {
  try {
    console.log("Extracting coordinates from URL:", url);
    // Handle Google Maps URLs
    // Format: https://maps.app.goo.gl/xxx or https://www.google.com/maps/place/...
    const coordinates = { latitude: 0, longitude: 0 };
    
    // Try to find coordinates in URL parameters
    const urlObj = new URL(url);
    
    // Handle shortened goo.gl URLs by extracting coordinates from the path
    if (url.includes('maps.app.goo.gl')) {
      // For these URLs, coordinates are often in the fragment
      const parts = url.split('@');
      console.log("URL parts:", parts);
      const coords = parts[1]?.split(',');
      if (coords && coords.length >= 2) {
        coordinates.latitude = parseFloat(coords[0]);
        coordinates.longitude = parseFloat(coords[1]);
        console.log("Extracted coordinates:", coordinates);
        return coordinates;
      }
    }
    
    // Handle full Google Maps URLs
    if (url.includes('google.com/maps')) {
      // Try to find coordinates in the URL path
      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        coordinates.latitude = parseFloat(match[1]);
        coordinates.longitude = parseFloat(match[2]);
        return coordinates;
      }
      
      // Try to find coordinates in the URL parameters
      const params = new URLSearchParams(urlObj.search);
      const query = params.get('q');
      if (query) {
        const coordMatch = query.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordMatch) {
          coordinates.latitude = parseFloat(coordMatch[1]);
          coordinates.longitude = parseFloat(coordMatch[2]);
          return coordinates;
        }
      }
    }
    
    console.log("No coordinates found in URL");
    return null;
  } catch (error) {
    console.error('Error extracting coordinates:', error);
    return null;
  }
}
