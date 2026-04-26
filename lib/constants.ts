// Thresholds — all tunable via environment
export const RISK_TRIGGER = parseFloat(process.env.NEXT_PUBLIC_RISK_THRESHOLD || '0.72');
export const THREAT_COOLDOWN_MS = 30_000;   // min 30s between auto-SOS triggers
export const CALIBRATION_MS = 3_500;        // ignore signals during first 3.5s
export const DECAY_INTERVAL_MS = 100;       // risk decay tick
export const RECORDING_MAX_DURATION_MS = 120_000; // max 120s evidence recording

export const DEFAULT_RISK_SCORE = 0;
export const GPS_POLL_INTERVAL_MS = 5000;
export const AUDIO_POLL_INTERVAL_MS = 800;

export const THEME = {
  colors: {
    navy: '#0D1B3E',
    danger: '#E52D27',
    safe: '#00966E',
    caution: '#E67E22',
    warning: '#F39C12',
    lime: '#B8D92A',
  }
};
