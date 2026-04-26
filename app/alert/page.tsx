'use client';

import { useEffect, useState } from 'react';
import { useSOS } from '../../hooks/useSOS';
import { useSafeTraceStore } from '../../store/safetraceStore';
import { PulsingRing } from '../../components/alert/PulsingRing';
import { LiveMap } from '../../components/alert/LiveMap';
import { Badge } from '../../components/ui/Badge';

export default function AlertPage() {
  const { cancelSOS, isActive, sessionId } = useSOS();
  const { contacts } = useSafeTraceStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCancel = () => {
    cancelSOS('I am safe now');
  };

  if (!isActive) {
    return (
      <div className="flex h-screen items-center justify-center bg-danger text-white">
        <p>No active SOS session.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#2d0908] text-white overflow-hidden p-6 relative">
      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        <PulsingRing />

        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl font-bold tracking-widest text-danger">SOS ACTIVE</h1>
          <p className="font-mono text-xl tracking-widest">{formatTime(elapsed)}</p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="safe" className="animate-pulse">GPS LIVE</Badge>
            <Badge variant="danger" className="animate-pulse">REC {formatTime(elapsed)}</Badge>
          </div>
        </div>

        <div className="w-full max-w-md h-64 border border-white/20 rounded-xl">
          <LiveMap />
        </div>

        <div className="w-full max-w-md bg-black/30 p-4 rounded-xl space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase">Contacts Notified</h3>
          {contacts.map(c => (
            <div key={c.id} className="flex justify-between items-center text-sm">
              <span>{c.name}</span>
              <span className="text-safe flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Delivered
              </span>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-gray-500 text-sm italic">No contacts configured.</div>
          )}
        </div>
      </div>

      <button 
        onPointerDown={(e) => {
          const t = setTimeout(() => handleCancel(), 1500);
          (e.target as any)._timer = t;
        }}
        onPointerUp={(e) => clearTimeout((e.target as any)._timer)}
        onPointerLeave={(e) => clearTimeout((e.target as any)._timer)}
        className="w-full max-w-md mx-auto mt-6 bg-white/10 border border-white/30 text-white py-4 rounded-xl font-bold uppercase tracking-wide hover:bg-white/20 active:bg-white/30 transition-colors"
      >
        Hold to Cancel SOS
      </button>
    </div>
  );
}
