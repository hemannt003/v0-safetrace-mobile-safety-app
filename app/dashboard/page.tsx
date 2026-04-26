'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThreatDetection } from '../../hooks/useThreatDetection';
import { useSafeTraceStore } from '../../store/safetraceStore';
import { useSOS } from '../../hooks/useSOS';
import { RiskGauge } from '../../components/dashboard/RiskGauge';
import { SensorGrid } from '../../components/dashboard/SensorGrid';
import { SignalLog } from '../../components/dashboard/SignalLog';
import { ToggleSettings } from '../../components/dashboard/ToggleSettings';
import { ThreatDetector } from '../../lib/threat/ThreatDetector';

export default function Dashboard() {
  const router = useRouter();
  const [pinEntered, setPinEntered] = useState('');
  const [unlocked, setUnlocked] = useState(false); // set to false normally
  const { riskScore, recentSignals } = useSafeTraceStore();
  const { fireSOS } = useSOS();
  
  // Start monitoring automatically
  useThreatDetection();

  const handlePin = (val: string) => {
    const newPin = pinEntered + val;
    setPinEntered(newPin);
    if (newPin.length === 4) {
      // In a real app, verify against stored hash
      setUnlocked(true);
    }
  };

  const simulateStruggle = () => {
    ThreatDetector.injectSignal({
      type: 'motion_spike',
      weight: 0.8,
      timestamp: Date.now(),
      meta: { simulated: true }
    });
  };

  if (!unlocked) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-navy text-white p-4">
        <h2 className="mb-8 text-xl">Enter PIN</h2>
        <div className="text-3xl tracking-[1em] mb-12 h-8">{pinEntered.padEnd(4, '•')}</div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((key) => (
            <button 
              key={key} 
              onClick={() => {
                if (key === 'C') setPinEntered('');
                else if (key !== 'OK') handlePin(key.toString());
              }}
              className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl"
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-display font-bold">SafeTrace</h1>
        <button onClick={() => router.push('/calculator')} className="text-sm text-gray-400 hover:text-white">
          Exit to Calculator
        </button>
      </div>

      <div className="space-y-6">
        <section className="bg-white/5 rounded-2xl p-4">
          <RiskGauge score={riskScore} />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Live Sensors</h2>
          <SensorGrid />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Threat Log</h2>
          <SignalLog signals={recentSignals} />
        </section>

        <section className="bg-white/5 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Detection Settings</h2>
          <ToggleSettings />
        </section>

        <section className="pt-4 space-y-4">
          <button 
            onClick={simulateStruggle}
            className="w-full bg-warning/20 text-warning border border-warning/50 py-3 rounded-xl font-bold uppercase tracking-wide hover:bg-warning/30"
          >
            Simulate Struggle (Demo)
          </button>
          
          <button 
            onClick={() => fireSOS({ type: 'manual', signals: [], score: 1.0 })}
            className="w-full bg-danger text-white py-4 rounded-xl font-bold uppercase tracking-wide shadow-lg shadow-danger/20 hover:bg-danger/90"
          >
            Manual SOS
          </button>
        </section>
      </div>
    </div>
  );
}
