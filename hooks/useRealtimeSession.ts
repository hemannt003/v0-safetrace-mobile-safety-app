import { useState, useEffect } from 'react';
import { subscribeToSessionTracking } from '../lib/supabase/realtime';
import { GPSPoint } from '../types';

export function useRealtimeSession(sessionId: string) {
  const [trail, setTrail] = useState<GPSPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Fetch initial trail via REST
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/sos/track/${sessionId}`);
        const data = await res.json();
        if (data && data.trail) {
          setTrail(data.trail);
          if (data.trail.length > 0) {
            setLastUpdated(new Date(data.trail[0].recorded_at));
          }
        }
      } catch (error) {
        console.error('Error fetching initial trail:', error);
      }
    };

    fetchInitial();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSessionTracking(sessionId, (newPoint) => {
      setTrail((prev) => [newPoint, ...prev]);
      setLastUpdated(new Date(newPoint.recordedAt));
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  return { trail, lastUpdated };
}
