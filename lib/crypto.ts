// Uses browser's SubtleCrypto — no external dependency
// AES-GCM 256-bit

export async function deriveKey(sessionId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(sessionId + '_safetrace_v1'),
    { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('safetrace_salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  );
}

export async function encryptBlob(blob: Blob, sessionId: string): Promise<ArrayBuffer> {
  const key = await deriveKey(sessionId);
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const data = await blob.arrayBuffer();
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  // Prepend IV to ciphertext
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encrypted), iv.length);
  return result.buffer;
}

export async function decryptEvidence(
  encrypted: ArrayBuffer, sessionId: string
): Promise<Blob> {
  const key  = await deriveKey(sessionId);
  const data = new Uint8Array(encrypted);
  const iv   = data.slice(0, 12);
  const ct   = data.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new Blob([decrypted], { type: 'audio/webm' });
}
