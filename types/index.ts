export type SignalType =
  | 'motion_spike'
  | 'sudden_stillness'
  | 'loud_audio'
  | 'scream_detected'
  | 'distress_keyword'
  | 'danger_zone'
  | 'nighttime_risk'
  | 'manual_trigger';

export interface User {
  id:         string;
  phone:      string;
  name:       string;
  createdAt:  string;
}

export interface Contact {
  id:       string;
  userId:   string;
  name:     string;
  phone:    string;
  relation: string;
}

export interface GPSPoint {
  lat:        number;
  lng:        number;
  accuracy:   number;
  recordedAt: string;
}

export interface SOSSession {
  id:                 string;
  userId:             string;
  status:             'active' | 'cancelled' | 'resolved';
  triggerType:        'auto_voice' | 'auto_motion' | 'manual';
  riskScore:          number;
  startedAt:          string;
  endedAt:            string | null;
  policeNotified:     boolean;
  contactsNotified:   number;
  gpsTrail:           GPSPoint[];
}

export interface ThreatSignal {
  type:      SignalType;
  weight:    number;
  meta:      Record<string, unknown>;
  timestamp: number;
}

export interface IncidentReport {
  sessionId:         string;
  startTime:         number;
  endTime:           number;
  reason:            string;
  gpsTrail:          GPSPoint[];
  pointCount:        number;
  evidenceKey:       string | null;
  contactsNotified:  number;
  riskScore:         number;
}

export interface GeminiAudioResponse {
  threat:          boolean;
  confidence:      number;
  indicators:      string[];
  detectedWords:   string[];
  explanation:     string;
}

export interface GeminiRiskResponse {
  threatLevel:     'safe' | 'caution' | 'warning' | 'danger';
  confidenceScore: number;
  reasoning:       string;
  recommendSOS:    boolean;
}

export interface TriggerData {
  type: 'auto_voice' | 'auto_motion' | 'manual';
  signals: ThreatSignal[];
  score: number;
}
