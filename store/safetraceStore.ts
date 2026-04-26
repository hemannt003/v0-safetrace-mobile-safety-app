import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThreatSignal, GPSPoint, Contact, IncidentReport } from '../types';

interface SafeTraceState {
  // Detection state
  riskScore:       number;
  recentSignals:   ThreatSignal[];
  isMonitoring:    boolean;

  // SOS state
  sosActive:       boolean;
  sessionId:       string | null;
  gpsTrail:        GPSPoint[];
  sosStartTime:    number | null;

  // Settings
  voiceEnabled:    boolean;
  motionEnabled:   boolean;
  nightModeEnabled: boolean;
  riskThreshold:   number;

  // User data
  contacts:        Contact[];
  incidents:       IncidentReport[];

  // Actions
  setRiskScore:    (score: number, signals: ThreatSignal[]) => void;
  startSOS:        (sessionId: string) => void;
  endSOS:          () => void;
  addGPSPoint:     (point: GPSPoint) => void;
  setContacts:     (contacts: Contact[]) => void;
  toggleVoice:     () => void;
  toggleMotion:    () => void;
  toggleNightMode: () => void;
  setIsMonitoring: (isMonitoring: boolean) => void;
  resetSOSState:   () => void;
}

export const useSafeTraceStore = create<SafeTraceState>()(
  persist(
    (set, get) => ({
      // Initial state
      riskScore: 0,
      recentSignals: [],
      isMonitoring: false,
      
      sosActive: false,
      sessionId: null,
      gpsTrail: [],
      sosStartTime: null,

      voiceEnabled: true,
      motionEnabled: true,
      nightModeEnabled: false,
      riskThreshold: parseFloat(process.env.NEXT_PUBLIC_RISK_THRESHOLD || '0.72'),

      contacts: [],
      incidents: [],

      // Actions
      setRiskScore: (score, signals) => set({ riskScore: score, recentSignals: signals }),
      startSOS: (sessionId) => set({ 
        sosActive: true, 
        sessionId, 
        sosStartTime: Date.now(),
        isMonitoring: false // disable standard monitoring during SOS
      }),
      endSOS: () => set({
        sosActive: false,
        // We do not nullify sessionId immediately so post-SOS logic can access it
      }),
      resetSOSState: () => set({
        sosActive: false,
        sessionId: null,
        gpsTrail: [],
        sosStartTime: null
      }),
      addGPSPoint: (point) => set((state) => ({ 
        gpsTrail: [point, ...state.gpsTrail] 
      })),
      setContacts: (contacts) => set({ contacts }),
      toggleVoice: () => set((state) => ({ voiceEnabled: !state.voiceEnabled })),
      toggleMotion: () => set((state) => ({ motionEnabled: !state.motionEnabled })),
      toggleNightMode: () => set((state) => ({ nightModeEnabled: !state.nightModeEnabled })),
      setIsMonitoring: (isMonitoring) => set({ isMonitoring })
    }),
    {
      name: 'safetrace-settings',
      partialize: (state) => ({
        voiceEnabled: state.voiceEnabled,
        motionEnabled: state.motionEnabled,
        nightModeEnabled: state.nightModeEnabled,
        riskThreshold: state.riskThreshold,
        contacts: state.contacts
      }),
    }
  )
);
