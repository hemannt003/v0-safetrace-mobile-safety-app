import { encryptBlob } from '../crypto';
import { openDB } from 'idb';

const MAX_DURATION = 120_000; // 120s max

export class EvidenceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: BlobPart[] = [];
  private active = false;
  private evidenceKey: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  async start(sessionId: string): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.chunks = [];
    this.evidenceKey = `evidence_${sessionId}`;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        await this.saveEncrypted(blob, sessionId);
        this.cleanup();
      };

      this.mediaRecorder.start(1000); // collect 1s chunks
      
      this.timer = setTimeout(() => {
        this.stop();
      }, MAX_DURATION);

    } catch (e) {
      console.error('[EvidenceRecorder] Failed to start:', e);
      this.active = false;
    }
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    
    if (this.timer) clearTimeout(this.timer);
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      this.cleanup();
    }
  }

  getEvidenceKey(): string | null {
    return this.evidenceKey;
  }

  private async saveEncrypted(blob: Blob, sessionId: string) {
    try {
      const encryptedBuffer = await encryptBlob(blob, sessionId);
      const db = await openDB('SafeTraceDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('evidence')) {
            db.createObjectStore('evidence');
          }
        },
      });
      await db.put('evidence', encryptedBuffer, this.evidenceKey!);
      console.log(`[EvidenceRecorder] Saved encrypted evidence with key: ${this.evidenceKey}`);
    } catch (e) {
      console.error('[EvidenceRecorder] Failed to save encrypted blob:', e);
    }
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.stream = null;
    this.mediaRecorder = null;
  }
}
