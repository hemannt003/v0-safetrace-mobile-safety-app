'use client';

import { useEffect, useRef, useState } from 'react';
import { getGoogleMapsLoader } from '../../lib/maps/googleMaps';
import { useSafeTraceStore } from '../../store/safetraceStore';

export function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { gpsTrail } = useSafeTraceStore();
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = getGoogleMapsLoader();
        const google = await loader.load();

        if (mapRef.current && !mapInstanceRef.current) {
          const initialPos = gpsTrail[0] || { lat: 20.5937, lng: 78.9629 };
          
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: initialPos.lat, lng: initialPos.lng },
            zoom: 16,
            disableDefaultUI: true,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }],
              },
            ],
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
            position: { lat: initialPos.lat, lng: initialPos.lng },
            map: mapInstanceRef.current,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#E52D27',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
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
    if (mapLoaded && mapInstanceRef.current && polylineRef.current && markerRef.current && gpsTrail.length > 0) {
      const path = gpsTrail.slice().reverse().map(p => ({ lat: p.lat, lng: p.lng }));
      polylineRef.current.setPath(path);
      
      const latest = path[path.length - 1];
      markerRef.current.setPosition(latest);
      mapInstanceRef.current.panTo(latest);
    }
  }, [gpsTrail, mapLoaded]);

  return <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden bg-gray-800" />;
}
