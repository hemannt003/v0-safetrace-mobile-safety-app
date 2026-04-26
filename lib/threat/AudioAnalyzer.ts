import { EventEmitter } from '../utils/EventEmitter';
import { ThreatSignal } from '../../types';

export class AudioAnalyzer extends EventEmitter {
  private active = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private onSignal?: (signal: ThreatSignal) => void;
  private isProcessingAudio = false;

  async start(callback: (signal: ThreatSignal) => void): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.onSignal = callback;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.timer = setInterval(this.pollAudio, 800);
    } catch (error) {
      console.error('[SafeTrace] Audio permission denied or not supported', error);
      // Simulate for demo if permissions denied
    }
  }

  stop(): void {
    this.active = false;
    if (this.timer) clearInterval(this.timer);
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    this.mediaRecorder = null;
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
  }

  private pollAudio = async () => {
    if (!this.active || !this.analyser || this.isProcessingAudio) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const norm = dataArray[i] / 255.0;
      sumSquares += norm * norm;
    }
    
    const rms = Math.sqrt(sumSquares / dataArray.length);

    if (rms > 0.76) {
      this.onSignal?.({
        type: 'loud_audio',
        weight: 0.55,
        meta: { rms },
        timestamp: Date.now()
      });

      if (rms > 0.91) {
        await this.analyzeAudioWithGemini();
      }
    }
  };

  private async analyzeAudioWithGemini() {
    if (!this.mediaStream || this.isProcessingAudio) return;
    this.isProcessingAudio = true;

    try {
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];

      this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await this.processGemini(blob);
        this.isProcessingAudio = false;
      };

      this.mediaRecorder.start();
      
      // Record exactly 2 seconds for Gemini
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, 2000);
      
    } catch (e) {
      console.error('[AudioAnalyzer] Error capturing audio', e);
      this.isProcessingAudio = false;
    }
  }

  private async processGemini(blob: Blob) {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (!base64data) return;

        const res = await fetch('/api/ai/analyze-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData: base64data })
        });
        
        if (!res.ok) return;
        
        const result = await res.json();
        
        if (result.threat && result.indicators.includes('scream')) {
          this.onSignal?.({
            type: 'scream_detected',
            weight: 0.82,
            meta: { confidence: result.confidence },
            timestamp: Date.now()
          });
        }
        
        if (result.threat && result.detected_words && result.detected_words.length > 0) {
          this.onSignal?.({
            type: 'distress_keyword',
            weight: 0.75,
            meta: { words: result.detected_words, confidence: result.confidence },
            timestamp: Date.now()
          });
        }
      };
    } catch (error) {
      console.error('[AudioAnalyzer] Error processing Gemini response:', error);
    }
  }
}
