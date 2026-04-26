import { useSafeTraceStore } from '../../store/safetraceStore';

export function ToggleSettings() {
  const { voiceEnabled, motionEnabled, nightModeEnabled, toggleVoice, toggleMotion, toggleNightMode } = useSafeTraceStore();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">Voice AI Detection</div>
          <div className="text-xs text-gray-400">Listen for screams/distress words</div>
        </div>
        <button 
          onClick={toggleVoice}
          className={`w-12 h-6 rounded-full transition-colors relative ${voiceEnabled ? 'bg-safe' : 'bg-gray-600'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${voiceEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">Motion Sensing</div>
          <div className="text-xs text-gray-400">Detect sudden drops or struggle</div>
        </div>
        <button 
          onClick={toggleMotion}
          className={`w-12 h-6 rounded-full transition-colors relative ${motionEnabled ? 'bg-safe' : 'bg-gray-600'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${motionEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">Night Mode</div>
          <div className="text-xs text-gray-400">Increase sensitivity after 10PM</div>
        </div>
        <button 
          onClick={toggleNightMode}
          className={`w-12 h-6 rounded-full transition-colors relative ${nightModeEnabled ? 'bg-safe' : 'bg-gray-600'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${nightModeEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  );
}
