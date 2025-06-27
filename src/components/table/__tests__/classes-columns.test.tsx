import { render, screen } from '@testing-library/react'
import { flexRender } from '@tanstack/react-table'
import {
  classesColumns,
  sampleClassesData,
  type ClassData,
} from '../classes-columns'

// テーブルのセルレンダリングをテストするヘルパー
const renderCell = (column: any, data: ClassData) => {
  const cell = {
    getValue: (key: string) => data[key as keyof ClassData],
    row: {
      original: data,
      getValue: (key: string) => data[key as keyof ClassData],
    },
    getContext: () => ({ cell }),
  }
  return render(<div>{flexRender(column.cell, cell)}</div>)
}

describe('Classes Columns', () => {
  const testClass: ClassData = sampleClassesData[0]

  describe('Name Column', () => {
    it('renders class name with school icon', () => {
      const nameColumn = classesColumns.find(
        (col) => col.accessorKey === 'name'
      )!
      renderCell(nameColumn, testClass)

      expect(screen.getByText(testClass.name)).toBeInTheDocument()
    })
  })

  describe('Year Column', () => {
    it('renders year with badge', () => {
      const yearColumn = classesColumns.find(
        (col) => col.accessorKey === 'year'
      )!
      renderCell(yearColumn, testClass)

      expect(screen.getByText(`${testClass.year}年`)).toBeInTheDocument()
    })
  })

  describe('Room Column', () => {
    it('renders room information', () => {
      const roomColumn = classesColumns.find(
        (col) => col.accessorKey === 'room'
      )!
      renderCell(roomColumn, testClass)

      expect(screen.getByText(testClass.room.name)).toBeInTheDocument()
      expect(
        screen.getByText(`定員: ${testClass.room.capacity}名`)
      ).toBeInTheDocument()
    })
  })

  describe('Students Count Column', () => {
    it('renders students count with users icon', () => {
      const studentsColumn = classesColumns.find(
        (col) => col.accessorKey === 'studentsCount'
      )!
      renderCell(studentsColumn, testClass)

      expect(
        screen.getByText(`${testClass.studentsCount}名`)
      ).toBeInTheDocument()
    })
  })

  describe('Committee Members Column', () => {
    it('renders committee members count with appropriate badge', () => {
      const committeeColumn = classesColumns.find(
        (col) => col.accessorKey === 'committeeMembers'
      )!
      renderCell(committeeColumn, testClass)

      expect(
        screen.getByText(`${testClass.committeeMembers}名`)
      ).toBeInTheDocument()
    })

    it('renders secondary badge when no committee members', () => {
      const classWithNoMembers = { ...testClass, committeeMembers: 0 }
      const committeeColumn = classesColumns.find(
        (col) => col.accessorKey === 'committeeMembers'
      )!
      renderCell(committeeColumn, classWithNoMembers)

      expect(screen.getByText('0名')).toBeInTheDocument()
    })
  })

  describe('Status Column', () => {
    it('renders active status', () => {
      const statusColumn = classesColumns.find(
        (col) => col.accessorKey === 'isActive'
      )!
      renderCell(statusColumn, testClass)

      expect(screen.getByText('アクティブ')).toBeInTheDocument()
    })

    it('renders inactive status', () => {
      const inactiveClass = { ...testClass, isActive: false }
      const statusColumn = classesColumns.find(
        (col) => col.accessorKey === 'isActive'
      )!
      renderCell(statusColumn, inactiveClass)

      expect(screen.getByText('非アクティブ')).toBeInTheDocument()
    })
  })

  describe('Created At Column', () => {
    it('renders formatted creation date', () => {
      const createdAtColumn = classesColumns.find(
        (col) => col.accessorKey === 'createdAt'
      )!
      renderCell(createdAtColumn, testClass)

      const expectedDate = new Date(testClass.createdAt).toLocaleDateString(
        'ja-JP'
      )
      expect(screen.getByText(expectedDate)).toBeInTheDocument()
    })
  })

  describe('Actions Column', () => {
    it('renders actions dropdown', () => {
      const actionsColumn = classesColumns.find((col) => col.id === 'actions')!
      const cell = {
        row: { original: testClass },
        getContext: () => ({ cell }),
      }

      render(<div>{flexRender(actionsColumn.cell, cell)}</div>)

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
