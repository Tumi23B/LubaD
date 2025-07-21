// locationService.js

// Predefined locations in Gauteng
export const predefinedLocations = {
  'Johannesburg': { lat: -26.2041, lng: 28.0473 },
  'Pretoria': { lat: -25.7479, lng: 28.2293 },
  'Sandton': { lat: -26.1076, lng: 28.0567 },
  'Midrand': { lat: -25.9895, lng: 28.1283 },
  'Randburg': { lat: -26.0944, lng: 27.9997 },
  'Roodepoort': { lat: -26.1625, lng: 27.8725 },
  'Soweto': { lat: -26.2678, lng: 27.8585 },
  'Centurion': { lat: -25.8740, lng: 28.1856 },
  'Boksburg': { lat: -26.2119, lng: 28.2594 },
  'Germiston': { lat: -26.2213, lng: 28.1690 },
  'Kempton Park': { lat: -26.1070, lng: 28.2317 },
  'Alberton': { lat: -26.2679, lng: 28.1222 },
  'Benoni': { lat: -26.1510, lng: 28.3945 },
  'Vereeniging': { lat: -26.6731, lng: 27.9260 },
  'Brakpan': { lat: -26.2366, lng: 28.3694 },
  'Springs': { lat: -26.2549, lng: 28.3985 },
  'Nigel': { lat: -26.4314, lng: 28.4771 },
  'Meyerton': { lat: -26.5564, lng: 28.0125 }
};

// Calculate distance between two points in km (Haversine formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Calculate base price based on distance
export function calculateBasePrice(distance) {
  const baseRate = 50; // Base rate in Rands
  const perKmRate = 5; // Rate per km in Rands
  return baseRate + (distance * perKmRate);
}

// Get location coordinates by name
export function getLocationCoordinates(locationName) {
  return predefinedLocations[locationName] || null;
}