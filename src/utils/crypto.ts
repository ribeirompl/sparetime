/**
 * Crypto utilities for data integrity verification
 *
 * Uses the Web Crypto API (SubtleCrypto) for cryptographic operations.
 * This API is available in all modern browsers and provides secure,
 * hardware-accelerated cryptographic primitives.
 *
 * Used for:
 * - Google Drive backup integrity verification
 * - Detecting data tampering or corruption during sync
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
 */

/**
 * Generate a SHA-256 checksum of arbitrary data
 *
 * Algorithm:
 * 1. Convert data to JSON string (deterministic serialization)
 * 2. Encode string to UTF-8 bytes using TextEncoder
 * 3. Compute SHA-256 hash using Web Crypto API
 * 4. Convert hash bytes to hexadecimal string
 *
 * The resulting checksum is a 64-character hexadecimal string
 * that uniquely identifies the data. Any change to the input
 * will produce a completely different checksum.
 *
 * @param data - Any JSON-serializable data (object, array, primitive)
 * @returns Promise resolving to 64-character hexadecimal hash string
 *
 * @example
 * const hash = await generateChecksum({ name: "Task 1", id: 123 })
 * // Returns: "a1b2c3d4e5f6..." (64 hex characters)
 *
 * @throws Will reject if Web Crypto API is unavailable (very rare)
 */
export async function generateChecksum(data: unknown): Promise<string> {
  // TextEncoder converts string to Uint8Array of UTF-8 bytes
  const encoder = new TextEncoder()

  // JSON.stringify provides deterministic serialization
  // Note: Object key order is preserved in modern JS engines (ES2015+)
  const jsonString = JSON.stringify(data)

  // Compute SHA-256 hash using SubtleCrypto
  // This is a one-way cryptographic hash - cannot be reversed
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(jsonString))

  // Convert ArrayBuffer to array of bytes
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // Convert each byte to 2-digit hexadecimal, then join
  // padStart(2, '0') ensures bytes like 0x0F become "0f" not "f"
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
