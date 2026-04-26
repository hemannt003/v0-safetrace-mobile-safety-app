import { useState, useEffect } from 'react';
import { GPSPoint } from '../types';

export function useGeolocation() {
  const [location, setLocation] = useState<GPSPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof navigator !== 'undefined' && 'geolocation' in navigator);
  }, []);

  const getCurrentPosition = (): Promise<GPSPoint> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const point: GPSPoint = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            recordedAt: new Date(position.timestamp).toISOString()
          };
          setLocation(point);
          resolve(point);
        },
        (err) => {
          setError(err.message);
          reject(err);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    });
  };

  return { location, error, isSupported, getCurrentPosition };
}
