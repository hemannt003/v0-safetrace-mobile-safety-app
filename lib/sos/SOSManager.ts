import { EventEmitter } from '../utils/EventEmitter';
import { GPSTracker } from './GPSTracker';
import { EvidenceRecorder } from './EvidenceRecorder';
import { TriggerData, IncidentReport } from '../../types';

export class SOSManager extends EventEmitter {
  private sessionId: string | null = null;
  private gpsTracker = new GPSTracker();
  private recorder = new EvidenceRecorder();
  private active = false;

  constructor() {
    super();
    this.gpsTracker.on('gps_update', (point) => {
      this.emit('gps_update', point);
    });
  }

  async fire(triggerData: TriggerData): Promise<string> {
    if (this.active && this.sessionId) return this.sessionId;
    
    this.active = true;
    
    // In a real scenario, we'd fetch contacts and last known location from context/store
    // We send these to the API
    try {
      const res = await fetch('/api/sos/fire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerData })
      });
      
      const data = await res.json();
      this.sessionId = data.sessionId;
      
      if (this.sessionId) {
        this.gpsTracker.start(this.sessionId);
        this.recorder.start(this.sessionId);
      }
      
      return this.sessionId || '';
    } catch (e) {
      console.error('[SOSManager] Error firing SOS:', e);
      // Fallback: generate a local ID if offline
      this.sessionId = `offline_${Date.now()}`;
      this.gpsTracker.start(this.sessionId);
      this.recorder.start(this.sessionId);
      return this.sessionId;
    }
  }

  async cancel(reason: string): Promise<IncidentReport | null> {
    if (!this.active || !this.sessionId) return null;
    
    this.active = false;
    const currentSessionId = this.sessionId;
    
    this.gpsTracker.stop();
    this.recorder.stop();
    
    const evidenceKey = this.recorder.getEvidenceKey();
    
    try {
      const res = await fetch('/api/sos/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          reason,
          evidenceKey
        })
      });
      
      this.sessionId = null;
      return await res.json() as IncidentReport;
    } catch (e) {
      console.error('[SOSManager] Error cancelling SOS:', e);
      this.sessionId = null;
      return null;
    }
  }
}
