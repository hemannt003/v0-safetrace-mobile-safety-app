'use client';

import { useEffect, useRef, useState } from 'react';
import { getGoogleMapsLoader } from '../../lib/maps/googleMaps';
import { useRealtimeSession } from '../../hooks/useRealtimeSession';

export function TrackingMap({ sessionId }: { sessionId: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { trail, lastUpdated } = useRealtimeSession(sessionId);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = getGoogleMapsLoader();
        const google = await loader.load();

        if (mapRef.current && !mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: 20.5937, lng: 78.9629 },
            zoom: 16,
            disableDefaultUI: false,
          });

          polylineRef.current = new google.maps.Polyline({
            path: [],
            geodesic: true,
            strokeColor: '#E52D27',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: mapInstanceRef.current,
          });

          markerRef.current = new google.maps.Marker({
            position: null,
            map: mapInstanceRef.current,
          });

          setMapLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current && polylineRef.current && markerRef.current && trail.length > 0) {
      const path = trail.slice().reverse().map(p => ({ lat: p.lat, lng: p.lng }));
      polylineRef.current.setPath(path);
      
      const latest = path[path.length - 1];
      markerRef.current.setPosition(latest);
      mapInstanceRef.current.panTo(latest);
    }
  }, [trail, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {lastUpdated && (
        <div className="absolute bottom-4 left-4 right-4 bg-white text-black p-3 rounded-xl shadow-lg text-sm text-center font-medium">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
