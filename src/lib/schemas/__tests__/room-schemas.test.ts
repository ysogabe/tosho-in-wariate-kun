/**
 * 図書室管理スキーマのテスト
 * TDD implementation following t_wada methodology
 */

import {
  createRoomSchema,
  updateRoomSchema,
  roomSearchSchema,
} from '../room-schemas'

describe('room-schemas', () => {
  describe('createRoomSchema', () => {
    it('有効な図書室作成データを受け入れる', () => {
      const validData = {
        name: '第1図書室',
        capacity: 5,
        description: '5年生用の図書室です',
        isActive: true,
      }

      expect(() => createRoomSchema.parse(validData)).not.toThrow()
    })

    it('descriptionとisActiveは省略可能', () => {
      const minimalData = {
        name: '第2図書室',
        capacity: 8,
      }

      const result = createRoomSchema.parse(minimalData)
      expect(result.isActive).toBe(true) // デフォルト値
      expect(result.description).toBeUndefined()
    })

    it('空の図書室名を拒否する', () => {
      const invalidData = {
        name: '',
        capacity: 5,
      }

      expect(() => createRoomSchema.parse(invalidData)).toThrow(
        '図書室名は必須です'
      )
    })

    it('長すぎる図書室名を拒否する', () => {
      const invalidData = {
        name: 'あ'.repeat(51),
        capacity: 5,
      }

      expect(() => createRoomSchema.parse(invalidData)).toThrow(
        '図書室名は50文字以内で入力してください'
      )
    })

    it('無効な定員を拒否する', () => {
      const invalidData = {
        name: '第1図書室',
        capacity: 0,
      }

      expect(() => createRoomSchema.parse(invalidData)).toThrow(
        '定員は1以上で入力してください'
      )
    })

    it('定員が大きすぎる場合を拒否する', () => {
      const invalidData = {
        name: '第1図書室',
        capacity: 11,
      }

      expect(() => createRoomSchema.parse(invalidData)).toThrow(
        '定員は10以下で入力してください'
      )
    })

    it('整数以外の定員を拒否する', () => {
      const invalidData = {
        name: '第1図書室',
        capacity: 5.5,
      }

      expect(() => createRoomSchema.parse(invalidData)).toThrow(
        '定員は整数で入力してください'
      )
    })

    it('長すぎる説明を拒否する', () => {
      const invalidData = {
        name: '第1図書室',
        capacity: 5,
        description: 'あ'.repeat(201),
      }

      expect(() => createRoomSchema.parse(invalidData)).toThrow(
        '説明は200文字以内で入力してください'
      )
    })
  })

  describe('updateRoomSchema', () => {
    it('有効な更新データを受け入れる', () => {
      const validUpdates = [
        { name: '第1図書室（新）' },
        { capacity: 8 },
        { description: '更新された説明' },
        { isActive: false },
        {
          name: '中央図書室',
          capacity: 10,
          description: '新しく設置された図書室',
          isActive: true,
        },
      ]

      validUpdates.forEach((update) => {
        expect(() => updateRoomSchema.parse(update)).not.toThrow()
      })
    })

    it('空のオブジェクトも有効', () => {
      expect(() => updateRoomSchema.parse({})).not.toThrow()
    })

    it('無効な図書室名を拒否する', () => {
      expect(() => updateRoomSchema.parse({ name: '' })).toThrow(
        '図書室名は必須です'
      )
      expect(() => updateRoomSchema.parse({ name: 'あ'.repeat(51) })).toThrow(
        '図書室名は50文字以内で入力してください'
      )
    })

    it('無効な定員を拒否する', () => {
      expect(() => updateRoomSchema.parse({ capacity: 0 })).toThrow(
        '定員は1以上で入力してください'
      )
      expect(() => updateRoomSchema.parse({ capacity: 11 })).toThrow(
        '定員は10以下で入力してください'
      )
      expect(() => updateRoomSchema.parse({ capacity: 5.5 })).toThrow(
        '定員は整数で入力してください'
      )
    })

    it('長すぎる説明を拒否する', () => {
      expect(() =>
        updateRoomSchema.parse({ description: 'あ'.repeat(201) })
      ).toThrow('説明は200文字以内で入力してください')
    })
  })

  describe('roomSearchSchema', () => {
    it('有効な検索パラメータを受け入れる', () => {
      const validQueries = [
        {},
        { page: '1', limit: '20' },
        { search: '図書' },
        { isActive: 'true' },
        { minCapacity: '5', maxCapacity: '10' },
        {
          page: '2',
          limit: '15',
          search: '第1',
          isActive: 'false',
          minCapacity: '3',
          maxCapacity: '8',
        },
      ]

      validQueries.forEach((query) => {
        expect(() => roomSearchSchema.parse(query)).not.toThrow()
      })
    })

    it('デフォルト値が正しく適用される', () => {
      const result = roomSearchSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('数値の文字列を正しく変換する', () => {
      const result = roomSearchSchema.parse({
        page: '3',
        limit: '25',
        isActive: 'true',
        minCapacity: '5',
        maxCapacity: '8',
      })

      expect(result.page).toBe(3)
      expect(result.limit).toBe(25)
      expect(result.isActive).toBe(true)
      expect(result.minCapacity).toBe(5)
      expect(result.maxCapacity).toBe(8)
    })

    it('無効なページ番号を拒否する', () => {
      expect(() => roomSearchSchema.parse({ page: '0' })).toThrow()
      expect(() => roomSearchSchema.parse({ page: '-1' })).toThrow()
    })

    it('無効な制限数を拒否する', () => {
      expect(() => roomSearchSchema.parse({ limit: '0' })).toThrow()
      expect(() => roomSearchSchema.parse({ limit: '101' })).toThrow()
    })

    it('無効な最小定員を拒否する', () => {
      expect(() => roomSearchSchema.parse({ minCapacity: '0' })).toThrow()
      expect(() => roomSearchSchema.parse({ minCapacity: '-1' })).toThrow()
    })

    it('無効な最大定員を拒否する', () => {
      expect(() => roomSearchSchema.parse({ maxCapacity: '0' })).toThrow()
      expect(() => roomSearchSchema.parse({ maxCapacity: '-1' })).toThrow()
    })
  })

  describe('型推論の動作確認', () => {
    it('CreateRoomData型が正しく推論される', () => {
      const data = createRoomSchema.parse({
        name: '第1図書室',
        capacity: 5,
        description: 'テスト用図書室',
        isActive: true,
      })

      expect(typeof data.name).toBe('string')
      expect(typeof data.capacity).toBe('number')
      expect(typeof data.description).toBe('string')
      expect(typeof data.isActive).toBe('boolean')
    })

    it('UpdateRoomData型が正しく推論される', () => {
      const data = updateRoomSchema.parse({
        name: '更新された図書室',
        capacity: 8,
      })

      expect(typeof data.name).toBe('string')
      expect(typeof data.capacity).toBe('number')
      expect(data.description).toBeUndefined()
      expect(data.isActive).toBeUndefined()
    })

    it('RoomSearchParams型が正しく推論される', () => {
      const data = roomSearchSchema.parse({
        page: '2',
        limit: '15',
        search: '図書',
        isActive: 'true',
        minCapacity: '5',
      })

      expect(typeof data.page).toBe('number')
      expect(typeof data.limit).toBe('number')
      expect(typeof data.search).toBe('string')
      expect(typeof data.isActive).toBe('boolean')
      expect(typeof data.minCapacity).toBe('number')
    })
  })
})
