import { ThreatSignal } from '../../types';

export class RiskScorer {
  private signals: ThreatSignal[] = [];
  private score: number = 0;

  get currentScore() {
    return this.score;
  }

  get recentSignals() {
    const now = Date.now();
    return this.signals.filter(s => now - s.timestamp <= 12000);
  }

  addSignal(signal: ThreatSignal) {
    this.signals.push(signal);
    this.computeScore();
  }

  decay() {
    if (this.score > 0) {
      this.score = Math.max(0, this.score - 0.012);
    }
  }

  reset() {
    this.signals = [];
    this.score = 0;
  }

  private computeScore() {
    const now = Date.now();
    
    // Filter signals to last 12 seconds
    this.signals = this.signals.filter(s => now - s.timestamp <= 12000);
    
    // Compute score using exponential time-decay weighting:
    // score = min( sum(signal.weight * e^(-ageFraction * 2.2)) / 2.4, 1.0 )
    // where ageFraction = (now - signal.ts) / 12000
    let sum = 0;
    
    for (const signal of this.signals) {
      const ageFraction = (now - signal.timestamp) / 12000;
      const decayedWeight = signal.weight * Math.exp(-ageFraction * 2.2);
      sum += decayedWeight;
    }
    
    this.score = Math.min(sum / 2.4, 1.0);
  }
}
