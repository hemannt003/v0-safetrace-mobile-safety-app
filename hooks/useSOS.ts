import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeTraceStore } from '../store/safetraceStore';
import { SOSManager } from '../lib/sos/SOSManager';
import { TriggerData } from '../types';

// Create a singleton instance
const sosManager = new SOSManager();

export function useSOS() {
  const router = useRouter();
  const { startSOS, endSOS, addGPSPoint, sosActive, sessionId, gpsTrail } = useSafeTraceStore();

  const fireSOS = useCallback(async (triggerData: TriggerData) => {
    if (sosActive) return;
    
    // Subscribe to GPS updates
    sosManager.on('gps_update', (point) => {
      addGPSPoint(point);
    });

    const newSessionId = await sosManager.fire(triggerData);
    
    if (newSessionId) {
      startSOS(newSessionId);
      router.push('/alert');
    }
  }, [sosActive, startSOS, router, addGPSPoint]);

  const cancelSOS = useCallback(async (reason: string) => {
    if (!sosActive) return;
    
    const report = await sosManager.cancel(reason);
    endSOS();
    
    if (report && report.sessionId) {
      router.push(`/report/${report.sessionId}`);
    } else {
      router.push('/dashboard');
    }
  }, [sosActive, endSOS, router]);

  return {
    fireSOS,
    cancelSOS,
    isActive: sosActive,
    sessionId,
    gpsTrail
  };
}
