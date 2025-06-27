import { render, screen } from '@testing-library/react'
import { flexRender, type ColumnDef, type CellContext } from '@tanstack/react-table'
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
      id: 'accessorKey' in column && typeof column.accessorKey === 'string' 
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

  describe('Room Column', () => {
    it('renders room information', () => {
      const roomColumn = findColumnByAccessorKey('room')
      expect(roomColumn).toBeDefined()
      renderCell(roomColumn!, testClass)

      expect(screen.getByText(testClass.room.name)).toBeInTheDocument()
      expect(
        screen.getByText(`定員: ${testClass.room.capacity}名`)
      ).toBeInTheDocument()
    })
  })

  describe('Students Count Column', () => {
    it('renders students count with users icon', () => {
      const studentsColumn = findColumnByAccessorKey('studentsCount')
      expect(studentsColumn).toBeDefined()
      renderCell(studentsColumn!, testClass)

      expect(
        screen.getByText(`${testClass.studentsCount}名`)
      ).toBeInTheDocument()
    })
  })

  describe('Committee Members Column', () => {
    it('renders committee members count with appropriate badge', () => {
      const committeeColumn = findColumnByAccessorKey('committeeMembers')
      expect(committeeColumn).toBeDefined()
      renderCell(committeeColumn!, testClass)

      expect(
        screen.getByText(`${testClass.committeeMembers}名`)
      ).toBeInTheDocument()
    })

    it('renders secondary badge when no committee members', () => {
      const classWithNoMembers = { ...testClass, committeeMembers: 0 }
      const committeeColumn = findColumnByAccessorKey('committeeMembers')
      expect(committeeColumn).toBeDefined()
      renderCell(committeeColumn!, classWithNoMembers)

      expect(screen.getByText('0名')).toBeInTheDocument()
    })
  })

  describe('Status Column', () => {
    it('renders active status', () => {
      const statusColumn = findColumnByAccessorKey('isActive')
      expect(statusColumn).toBeDefined()
      renderCell(statusColumn!, testClass)

      expect(screen.getByText('アクティブ')).toBeInTheDocument()
    })

    it('renders inactive status', () => {
      const inactiveClass = { ...testClass, isActive: false }
      const statusColumn = findColumnByAccessorKey('isActive')
      expect(statusColumn).toBeDefined()
      renderCell(statusColumn!, inactiveClass)

      expect(screen.getByText('非アクティブ')).toBeInTheDocument()
    })
  })

  describe('Created At Column', () => {
    it('renders formatted creation date', () => {
      const createdAtColumn = findColumnByAccessorKey('createdAt')
      expect(createdAtColumn).toBeDefined()
      renderCell(createdAtColumn!, testClass)

      const expectedDate = new Date(testClass.createdAt).toLocaleDateString(
        'ja-JP'
      )
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
  })

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
      expect(sampleClassesData).toHaveLength(4)

      sampleClassesData.forEach((classData) => {
        expect(classData).toHaveProperty('id')
        expect(classData).toHaveProperty('name')
        expect(classData).toHaveProperty('year')
        expect(classData).toHaveProperty('room')
        expect(classData).toHaveProperty('studentsCount')
        expect(classData).toHaveProperty('committeeMembers')
        expect(classData).toHaveProperty('isActive')
        expect(classData).toHaveProperty('createdAt')
        expect(classData).toHaveProperty('updatedAt')
      })
    })

    it('has proper data types', () => {
      const firstClass = sampleClassesData[0]

      expect(typeof firstClass.id).toBe('string')
      expect(typeof firstClass.name).toBe('string')
      expect(typeof firstClass.year).toBe('number')
      expect(typeof firstClass.room).toBe('object')
      expect(typeof firstClass.studentsCount).toBe('number')
      expect(typeof firstClass.committeeMembers).toBe('number')
      expect(typeof firstClass.isActive).toBe('boolean')
      expect(typeof firstClass.createdAt).toBe('string')
      expect(typeof firstClass.updatedAt).toBe('string')
    })
  })
})
