import { render, screen } from '@testing-library/react'
import { flexRender, type ColumnDef } from '@tanstack/react-table'
import {
  classesColumns,
  sampleClassesData,
  type ClassData,
} from '../classes-columns'

// 型安全な列検索ヘルパー
const findColumnByAccessorKey = (
  key: keyof ClassData
): ColumnDef<ClassData> | undefined => {
  return classesColumns.find((col) => {
    return 'accessorKey' in col && col.accessorKey === key
  })
}

const findColumnById = (id: string): ColumnDef<ClassData> | undefined => {
  return classesColumns.find((col) => col.id === id)
}

// テーブルのセルレンダリングをテストするヘルパー
const renderCell = (column: ColumnDef<ClassData>, data: ClassData) => {
  // 簡化されたモックセルコンテキスト（any型でキャスト）
  const mockCell = {
    getValue: () => {
      if ('accessorKey' in column && typeof column.accessorKey === 'string') {
        return data[column.accessorKey as keyof ClassData]
      }
      return undefined
    },
    row: {
      id: data.id,
      index: 0,
      original: data,
      getValue: (columnId: string) => data[columnId as keyof ClassData],
    },
    column: {
      id:
        'accessorKey' in column && typeof column.accessorKey === 'string'
          ? column.accessorKey
          : column.id || 'unknown',
      columnDef: column,
    },
    table: {},
    cell: {},
    renderValue: () => undefined,
  } as any

  // セルコンテキストを更新
  mockCell.cell = mockCell

  return render(<div>{flexRender(column.cell, mockCell)}</div>)
}

describe('Classes Columns', () => {
  const testClass: ClassData = sampleClassesData[0]

  describe('Name Column', () => {
    it('renders class name with school icon', () => {
      const nameColumn = findColumnByAccessorKey('name')
      expect(nameColumn).toBeDefined()
      renderCell(nameColumn!, testClass)

      expect(screen.getByText(testClass.name)).toBeInTheDocument()
    })
  })

  describe('Year Column', () => {
    it('renders year with badge', () => {
      const yearColumn = findColumnByAccessorKey('year')
      expect(yearColumn).toBeDefined()
      renderCell(yearColumn!, testClass)

      expect(screen.getByText(`${testClass.year}年`)).toBeInTheDocument()
    })
  })

  describe('StudentCount Column', () => {
    it('renders student count', () => {
      const studentCountColumn = findColumnByAccessorKey('studentCount')
      expect(studentCountColumn).toBeDefined()
      renderCell(studentCountColumn!, testClass)

      expect(
        screen.getByText(`${testClass.studentCount}名`)
      ).toBeInTheDocument()
    })
  })

  describe('CreatedAt Column', () => {
    it('renders created date', () => {
      const createdAtColumn = findColumnByAccessorKey('createdAt')
      expect(createdAtColumn).toBeDefined()
      renderCell(createdAtColumn!, testClass)

      // The component formats the date as Japanese locale
      const expectedDate = new Date(testClass.createdAt).toLocaleDateString('ja-JP')
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
  })

  // Note: UpdatedAt and ID columns are not defined in the actual component

  // Note: This test is duplicated with the "CreatedAt Column" test above

  describe('Actions Column', () => {
    it('renders actions dropdown', () => {
      const actionsColumn = findColumnById('actions')
      expect(actionsColumn).toBeDefined()
      renderCell(actionsColumn!, testClass)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Sample Data', () => {
    it('contains valid sample data', () => {
      expect(sampleClassesData).toHaveLength(3)

      sampleClassesData.forEach((classData) => {
        expect(classData).toHaveProperty('id')
        expect(classData).toHaveProperty('name')
        expect(classData).toHaveProperty('year')
        expect(classData).toHaveProperty('studentCount')
        expect(classData).toHaveProperty('createdAt')
        expect(classData).toHaveProperty('updatedAt')
      })
    })

    it('has proper data types', () => {
      const firstClass = sampleClassesData[0]

      expect(typeof firstClass.id).toBe('string')
      expect(typeof firstClass.name).toBe('string')
      expect(typeof firstClass.year).toBe('number')
      expect(typeof firstClass.studentCount).toBe('number')
      expect(typeof firstClass.createdAt).toBe('string')
      expect(typeof firstClass.updatedAt).toBe('string')
    })
  })
})
