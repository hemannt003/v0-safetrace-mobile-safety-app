import { EventEmitter } from '../utils/EventEmitter';
import { GPSPoint } from '../../types';

export class GPSTracker extends EventEmitter {
  private watchId: number | null = null;
  private sessionId: string | null = null;
  private active: boolean = false;
  private lastKnownPoint: GPSPoint | null = null;

  start(sessionId: string): void {
    if (this.active) return;
    this.active = true;
    this.sessionId = sessionId;

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        this.handlePosition,
        this.handleError,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );
    } else {
      console.warn('[GPSTracker] Geolocation is not supported by this browser.');
    }
  }

  stop(): void {
    this.active = false;
    if (this.watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.watchId = null;
    this.sessionId = null;
  }

  private handlePosition = async (position: GeolocationPosition) => {
    if (!this.active || !this.sessionId) return;

    const point: GPSPoint = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      recordedAt: new Date(position.timestamp).toISOString()
    };

    this.lastKnownPoint = point;
    this.emit('gps_update', point);

    // Push to server non-blocking
    try {
      fetch('/api/sos/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          ...point
        })
      });
    } catch (e) {
      console.error('[GPSTracker] Error syncing location:', e);
    }
  };

  private handleError = (error: GeolocationPositionError) => {
    console.error('[GPSTracker] Geolocation error:', error.message);
    if (this.lastKnownPoint && this.active) {
      // Fallback: emit last known point with updated timestamp
      const fallbackPoint = {
        ...this.lastKnownPoint,
        recordedAt: new Date().toISOString()
      };
      this.emit('gps_update', fallbackPoint);
    }
  };
}
