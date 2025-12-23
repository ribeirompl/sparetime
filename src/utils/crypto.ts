/**
 * Crypto utilities for data integrity
 * Uses Web Crypto API for SHA-256 checksums
 */

/**
 * Generate SHA-256 checksum of data
 */
export async function generateChecksum(data: unknown): Promise<string> {
  const encoder = new TextEncoder()
  const jsonString = JSON.stringify(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(jsonString))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
