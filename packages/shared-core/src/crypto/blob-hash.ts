/**
 * Compute SHA256 hash of a Blob.
 *
 * @returns hex-encoded SHA256 hash
 */
export async function computeBlobHash(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();

  // Use Web Crypto API (available in both browser and Node.js)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Return first 12 characters for brevity (still unique enough for avatars)
  return hashHex.substring(0, 12);
}
