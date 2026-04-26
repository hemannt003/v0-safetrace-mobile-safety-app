import { RiskScorer } from './RiskScorer';
import { MotionAnalyzer } from './MotionAnalyzer';
import { AudioAnalyzer } from './AudioAnalyzer';
import { EventEmitter } from '../utils/EventEmitter';
import { ThreatSignal } from '../../types';
import { RISK_TRIGGER, THREAT_COOLDOWN_MS, CALIBRATION_MS, DECAY_INTERVAL_MS } from '../constants';

export interface RiskUpdate {
  score:   number;       // 0-1
  signals: ThreatSignal[];
}

class ThreatDetectorClass extends EventEmitter {
  private running       = false;
  private startedAt     = 0;
  private lastThreat    = 0;
  private decayTimer:   ReturnType<typeof setInterval> | null = null;
  private motionAnalyzer = new MotionAnalyzer();
  private audioAnalyzer  = new AudioAnalyzer();
  private riskScorer     = new RiskScorer();

  get isRunning() { return this.running; }
  get currentScore() { return this.riskScorer.currentScore; }

  async start(): Promise<void> {
    if (this.running) return;
    this.running   = true;
    this.startedAt = Date.now();

    // Request permissions
    await this.requestPermissions();

    // Start analyzers — each emits signals via callback
    this.motionAnalyzer.start((signal) => this.handleSignal(signal));
    await this.audioAnalyzer.start((signal) => this.handleSignal(signal));

    // Risk decay: score naturally falls without new signals
    this.decayTimer = setInterval(() => {
      if (!this.running) return;
      this.riskScorer.decay();
      this.emit('risk_update', {
        score:   this.riskScorer.currentScore,
        signals: this.riskScorer.recentSignals,
      } satisfies RiskUpdate);
    }, DECAY_INTERVAL_MS);
  }

  stop(): void {
    this.running = false;
    this.motionAnalyzer.stop();
    this.audioAnalyzer.stop();
    if (this.decayTimer) clearInterval(this.decayTimer);
    this.decayTimer = null;
    this.riskScorer.reset();
  }

  // Inject external signal (e.g. manual test, location risk)
  injectSignal(signal: ThreatSignal): void {
    this.handleSignal(signal);
  }

  private handleSignal(signal: ThreatSignal): void {
    // Ignore signals during calibration window
    if (Date.now() - this.startedAt < CALIBRATION_MS) return;
    if (!this.running) return;

    this.riskScorer.addSignal(signal);
    const score = this.riskScorer.currentScore;

    this.emit('risk_update', {
      score,
      signals: this.riskScorer.recentSignals,
    } satisfies RiskUpdate);

    // Trigger SOS if above threshold and cooldown passed
    if (score >= RISK_TRIGGER && Date.now() - this.lastThreat > THREAT_COOLDOWN_MS) {
      this.lastThreat = Date.now();
      this.emit('threat_confirmed', {
        score,
        signals:   this.riskScorer.recentSignals,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async requestPermissions(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (e) {
      console.warn('[SafeTrace] Microphone permission denied');
    }
  }
}

export const ThreatDetector = new ThreatDetectorClass();
