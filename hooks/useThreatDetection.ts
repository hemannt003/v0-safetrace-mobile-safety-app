import { useEffect, useCallback } from 'react';
import { ThreatDetector, RiskUpdate } from '../lib/threat/ThreatDetector';
import { useSafeTraceStore } from '../store/safetraceStore';
import { useSOS } from './useSOS';

export function useThreatDetection() {
  const { setRiskScore, setIsMonitoring, isMonitoring, sosActive } = useSafeTraceStore();
  const { fireSOS } = useSOS();

  const startMonitoring = useCallback(async () => {
    if (isMonitoring || sosActive) return;
    
    await ThreatDetector.start();
    setIsMonitoring(true);
  }, [isMonitoring, sosActive, setIsMonitoring]);

  const stopMonitoring = useCallback(() => {
    ThreatDetector.stop();
    setIsMonitoring(false);
  }, [setIsMonitoring]);

  useEffect(() => {
    const handleRiskUpdate = (update: RiskUpdate) => {
      setRiskScore(update.score, update.signals);
    };

    const handleThreatConfirmed = (data: any) => {
      console.warn('⚠️ THREAT CONFIRMED ⚠️', data);
      fireSOS({
        type: 'auto_voice', // or auto_motion depending on the signal
        signals: data.signals,
        score: data.score
      });
    };

    ThreatDetector.on('risk_update', handleRiskUpdate);
    ThreatDetector.on('threat_confirmed', handleThreatConfirmed);

    return () => {
      ThreatDetector.off('risk_update', handleRiskUpdate);
      ThreatDetector.off('threat_confirmed', handleThreatConfirmed);
    };
  }, [setRiskScore, fireSOS]);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
}
