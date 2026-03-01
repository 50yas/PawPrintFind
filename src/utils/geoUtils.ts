import { Geolocation } from '../types';

/** Haversine distance in km between two lat/lng points */
export const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Check if a point is within radius of center */
export const isWithinRadius = (point: Geolocation, center: Geolocation, radiusKm: number): boolean => {
  return haversineKm(point.latitude, point.longitude, center.latitude, center.longitude) <= radiusKm;
};

/** Sort items by proximity to a center point */
export const sortByProximity = <T>(
  items: T[],
  getLocation: (item: T) => Geolocation | null,
  center: Geolocation
): T[] => {
  return [...items].sort((a, b) => {
    const locA = getLocation(a);
    const locB = getLocation(b);
    if (!locA && !locB) return 0;
    if (!locA) return 1;
    if (!locB) return -1;
    const distA = haversineKm(center.latitude, center.longitude, locA.latitude, locA.longitude);
    const distB = haversineKm(center.latitude, center.longitude, locB.latitude, locB.longitude);
    return distA - distB;
  });
};

/** Get distance between two Geolocation objects in km */
export const distanceBetween = (a: Geolocation, b: Geolocation): number => {
  return haversineKm(a.latitude, a.longitude, b.latitude, b.longitude);
};
