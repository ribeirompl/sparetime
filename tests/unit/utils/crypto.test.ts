/**
 * Unit tests for SHA-256 checksum utilities
 * Tests for generateChecksum
 */

import { describe, it, expect } from 'vitest'
import { generateChecksum } from '@/utils/crypto'

describe('Crypto Utilities', () => {
  describe('generateChecksum', () => {
    it('should generate consistent checksum for same data', async () => {
      const data = 'test data for checksum'

      const checksum1 = await generateChecksum(data)
      const checksum2 = await generateChecksum(data)

      expect(checksum1).toBe(checksum2)
      expect(checksum1.length).toBe(64) // SHA-256 produces 64 hex characters
    })

    it('should generate different checksum for different data', async () => {
      const checksum1 = await generateChecksum('data1')
      const checksum2 = await generateChecksum('data2')

      expect(checksum1).not.toBe(checksum2)
    })

    it('should generate valid hex string', async () => {
      const checksum = await generateChecksum('test')

      expect(checksum).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should work with objects', async () => {
      const data = { name: 'test', value: 123 }
      const checksum = await generateChecksum(data)

      expect(checksum).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should work with arrays', async () => {
      const data = [1, 2, 3, 'test']
      const checksum = await generateChecksum(data)

      expect(checksum).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should be consistent for equivalent objects', async () => {
      const data1 = { a: 1, b: 2 }
      const data2 = { a: 1, b: 2 }

      const checksum1 = await generateChecksum(data1)
      const checksum2 = await generateChecksum(data2)

      expect(checksum1).toBe(checksum2)
    })
  })
})
