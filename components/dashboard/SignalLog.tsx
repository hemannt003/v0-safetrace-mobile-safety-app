import { ThreatSignal } from '../../types';

export function SignalLog({ signals }: { signals: ThreatSignal[] }) {
  if (signals.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        No active threats detected.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
      {signals.map((sig, i) => (
        <div key={i} className="flex justify-between items-center text-sm p-2 rounded bg-white/5 border border-white/10">
          <span className="text-white capitalize">{sig.type.replace('_', ' ')}</span>
          <span className="text-xs text-gray-400">
            {new Date(sig.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
          </span>
        </div>
      ))}
    </div>
  );
}
