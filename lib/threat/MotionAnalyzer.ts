import { EventEmitter } from '../utils/EventEmitter';
import { ThreatSignal, SignalType } from '../../types';

const THRESHOLD = 2.6; // g-force delta threshold
const STILLNESS_THRESHOLD = 0.04;
const STILLNESS_DURATION_MS = 9000;

export class MotionAnalyzer extends EventEmitter {
  private active = false;
  private onSignal?: (signal: ThreatSignal) => void;
  private baselineQueue: number[] = [];
  private lastActivityTime: number = 0;
  private stillnessTimer: ReturnType<typeof setTimeout> | null = null;

  async start(callback: (signal: ThreatSignal) => void): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.onSignal = callback;
    this.baselineQueue = [];
    this.lastActivityTime = Date.now();

    // Check permissions for iOS 13+
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState !== 'granted') {
          console.warn('[SafeTrace] DeviceMotion permission denied');
          this.simulateForDemo();
          return;
        }
      } catch (error) {
        console.error('[SafeTrace] Error requesting DeviceMotion permission', error);
      }
    }

    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', this.handleMotion);
    } else {
      console.warn('[SafeTrace] DeviceMotion not supported, simulating for demo');
      this.simulateForDemo();
    }
  }

  stop(): void {
    this.active = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.handleMotion);
    }
    if (this.stillnessTimer) clearTimeout(this.stillnessTimer);
  }

  private handleMotion = (event: DeviceMotionEvent) => {
    if (!this.active) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    
    // Maintain rolling 20-sample baseline
    this.baselineQueue.push(magnitude);
    if (this.baselineQueue.length > 20) {
      this.baselineQueue.shift();
    }

    const baseline = this.baselineQueue.reduce((a, b) => a + b, 0) / this.baselineQueue.length;
    const delta = Math.abs(magnitude - baseline);

    if (delta > THRESHOLD) {
      this.lastActivityTime = Date.now();
      if (this.stillnessTimer) {
        clearTimeout(this.stillnessTimer);
        this.stillnessTimer = null;
      }
      
      this.onSignal?.({
        type: 'motion_spike',
        weight: 0.60,
        meta: { delta },
        timestamp: Date.now()
      });
      
      // Setup stillness timer
      this.stillnessTimer = setTimeout(() => {
        this.checkStillness();
      }, STILLNESS_DURATION_MS);
    }
  };
  
  private checkStillness = () => {
    if (!this.active) return;
    this.onSignal?.({
      type: 'sudden_stillness',
      weight: 0.85,
      meta: { duration: STILLNESS_DURATION_MS },
      timestamp: Date.now()
    });
  };

  private simulateForDemo() {
    // For demo purposes, occasionally emit signals when motion API isn't available
    if (!this.active) return;
    // Don't auto-simulate signals to prevent unexpected behaviors, 
    // real signals should be injected manually via dashboard for testing
  }
}
