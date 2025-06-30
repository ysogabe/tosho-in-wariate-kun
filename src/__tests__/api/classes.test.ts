/**
 * @jest-environment node
 */

import {
  CreateClassSchema,
  UpdateClassSchema,
  ClassesQuerySchema,
  ClassIdParamSchema,
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

    test('Should allow spaces in class name', () => {
      const validData = { name: '5年 A組', year: 5 }
      const result = CreateClassSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('Should reject only spaces in class name', () => {
      const invalidData = { name: '   ', year: 5 }
      const result = CreateClassSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('Should reject special characters in class name', () => {
      const invalidData = { name: '5年@組', year: 5 }
      const result = CreateClassSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('Should reject names longer than 20 characters', () => {
      const invalidData = {
        name: 'あいうえおかきくけこさしすせそたちつてとな',
        year: 5,
      }
      const result = CreateClassSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('Should reject year below 5', () => {
      const invalidData = { name: '4年1組', year: 4 }
      const result = CreateClassSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('Should reject year above 6', () => {
      const invalidData = { name: '7年1組', year: 7 }
      const result = CreateClassSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    test('Should reject non-integer year', () => {
      const invalidData = { name: '5年1組', year: 5.5 }
      const result = CreateClassSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateClassSchema', () => {
    test('Should validate partial update data', () => {
      const validData = { name: '5年2組' }
      const result = UpdateClassSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('Should allow empty object for optional fields', () => {
      const validData = {}
      const result = UpdateClassSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    test('Should validate year only update', () => {
      const validData = { year: 6 }
      const result = UpdateClassSchema.safeParse(validData)
      expect(result.success).toBe(true)
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

    test('Should reject page less than 1', () => {
      const invalidQuery = { page: '0' }
      const result = ClassesQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    test('Should reject limit greater than 100', () => {
      const invalidQuery = { limit: '101' }
      const result = ClassesQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })

    test('Should reject search string longer than 100 characters', () => {
      const invalidQuery = { search: 'a'.repeat(101) }
      const result = ClassesQuerySchema.safeParse(invalidQuery)
      expect(result.success).toBe(false)
    })
  })

  describe('ClassIdParamSchema', () => {
    test('Should validate valid class ID', () => {
      const validId = { id: 'class-123' }
      const result = ClassIdParamSchema.safeParse(validId)
      expect(result.success).toBe(true)
    })

    test('Should reject empty ID', () => {
      const invalidId = { id: '' }
      const result = ClassIdParamSchema.safeParse(invalidId)
      expect(result.success).toBe(false)
    })

    test('Should reject ID with special characters', () => {
      const invalidId = { id: 'class@123' }
      const result = ClassIdParamSchema.safeParse(invalidId)
      expect(result.success).toBe(false)
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
