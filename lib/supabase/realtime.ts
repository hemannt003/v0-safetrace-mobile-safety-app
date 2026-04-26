import { createClient } from './client';
import { GPSPoint } from '../../types';

export const subscribeToSessionTracking = (
  sessionId: string, 
  onLocationUpdate: (point: GPSPoint) => void
) => {
  const supabase = createClient();
  
  const subscription = supabase
    .channel(`tracking:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'gps_points',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        const point = payload.new as any;
        onLocationUpdate({
          lat: point.lat,
          lng: point.lng,
          accuracy: point.accuracy,
          recordedAt: point.recorded_at
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};
