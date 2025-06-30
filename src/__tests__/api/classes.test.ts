/**
 * @jest-environment node
 */

import {
  CreateClassSchema,
  ClassesQuerySchema,
} from '@/lib/schemas/class-schemas'
import { createPaginationMeta } from '@/lib/api'

describe('/api/classes - Schema Validation', () => {
  describe('CreateClassSchema', () => {
    test('Should validate valid class data', () => {
      const validData = { name: 'A', year: 5 }
      const result = CreateClassSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('Should reject invalid year', () => {
      const invalidData = { name: 'A', year: 4 }
      const result = CreateClassSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('Should reject empty name', () => {
      const invalidData = { name: '', year: 5 }
      const result = CreateClassSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('ClassesQuerySchema', () => {
    test('Should parse valid query parameters', () => {
      const validQuery = { page: '1', limit: '20', year: '5' }
      const result = ClassesQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
        expect(result.data.year).toBe(5)
      }
    })

    test('Should use default values', () => {
      const emptyQuery = {}
      const result = ClassesQuerySchema.safeParse(emptyQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })
  })

  describe('Error Handler Utils', () => {
    test('Should export error handling utilities', () => {
      expect(createPaginationMeta).toBeDefined()

      const pagination = createPaginationMeta(1, 20, 100)
      expect(pagination.page).toBe(1)
      expect(pagination.limit).toBe(20)
      expect(pagination.total).toBe(100)
      expect(pagination.totalPages).toBe(5)
    })
  })
})
