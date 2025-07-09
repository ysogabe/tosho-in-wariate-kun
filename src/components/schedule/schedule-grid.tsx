'use client'

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Download, Printer, Search, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Assignment {
  id: string
  studentId: string
  roomId: string
  dayOfWeek: number
  term: 'FIRST_TERM' | 'SECOND_TERM'
  student: {
    id: string
    name: string
    grade: number
    class: {
      id: string
      name: string
      year: number
    }
  }
  room: {
    id: string
    name: string
    capacity: number
  }
}

interface ScheduleGridProps {
  assignments: Assignment[]
  term?: 'FIRST_TERM' | 'SECOND_TERM'
  onExport?: (format: string) => void
  className?: string
}

const dayNames = ['', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日']
const shortDayNames = ['', '月', '火', '水', '木', '金']

export function ScheduleGrid({
  assignments,
  term,
  onExport,
  className,
}: ScheduleGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')

  // フィルタリングされた割り当て
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesSearch =
        !searchTerm ||
        assignment.student.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.room.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRoom =
        selectedRoom === 'all' || assignment.room.id === selectedRoom
      const matchesGrade =
        selectedGrade === 'all' ||
        assignment.student.grade.toString() === selectedGrade

      return matchesSearch && matchesRoom && matchesGrade
    })
  }, [assignments, searchTerm, selectedRoom, selectedGrade])

  // 週間グリッドデータ作成
  const weeklyGrid = useMemo(() => {
    const grid: Record<number, Record<string, Assignment[]>> = {}

    // 1-5（月-金）で初期化
    for (let day = 1; day <= 5; day++) {
      grid[day] = {}
    }

    filteredAssignments.forEach((assignment) => {
      const { dayOfWeek, room } = assignment
      const roomName = room.name

      if (!grid[dayOfWeek][roomName]) {
        grid[dayOfWeek][roomName] = []
      }

      grid[dayOfWeek][roomName].push(assignment)
    })

    return grid
  }, [filteredAssignments])

  // 図書室一覧
  const rooms = useMemo(() => {
    const roomSet = new Set(assignments.map((a) => a.room.id))
    return assignments
      .filter((a) => roomSet.has(a.room.id))
      .map((a) => a.room)
      .filter(
        (room, index, arr) => arr.findIndex((r) => r.id === room.id) === index
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* コントロールパネル */}
      <Card
        className="print:hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '2px solid hsl(350, 80%, 90%)',
          borderRadius: '12px',
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle
                className="flex items-center gap-2"
                style={{
                  color: 'hsl(340, 80%, 45%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                <Calendar
                  className="h-5 w-5 animate-float"
                  style={{ color: 'hsl(180, 70%, 75%)' }}
                />
                📅 当番表表示設定
              </CardTitle>
              <CardDescription style={{ color: 'hsl(340, 60%, 50%)' }}>
                表示する内容をフィルタリングできます
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300"
                style={{
                  borderColor: 'hsl(180, 70%, 75%)',
                  color: 'hsl(340, 70%, 50%)',
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                🖨️ 印刷
              </Button>
              {onExport && (
                <Select onValueChange={onExport}>
                  <SelectTrigger
                    className="w-32 bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300"
                    style={{
                      borderColor: 'hsl(180, 70%, 75%)',
                      color: 'hsl(340, 70%, 50%)',
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="📤 出力" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">📊 CSV</SelectItem>
                    <SelectItem value="json">📋 JSON</SelectItem>
                    <SelectItem value="pdf">📄 PDF</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 検索 */}
            <div className="space-y-2">
              <Label
                htmlFor="search"
                style={{
                  color: 'hsl(340, 70%, 50%)',
                  fontWeight: '600',
                }}
              >
                🔍 検索
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="名前・図書室で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 rounded-md"
                  style={{
                    borderColor: 'hsl(180, 70%, 85%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  }}
                />
              </div>
            </div>

            {/* 図書室フィルタ */}
            <div className="space-y-2">
              <Label
                style={{
                  color: 'hsl(340, 70%, 50%)',
                  fontWeight: '600',
                }}
              >
                📚 図書室
              </Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger
                  className="rounded-md"
                  style={{
                    borderColor: 'hsl(180, 70%, 85%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 学年フィルタ */}
            <div className="space-y-2">
              <Label
                style={{
                  color: 'hsl(340, 70%, 50%)',
                  fontWeight: '600',
                }}
              >
                🎒 学年
              </Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger
                  className="rounded-md"
                  style={{
                    borderColor: 'hsl(180, 70%, 85%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="5">5年生</SelectItem>
                  <SelectItem value="6">6年生</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 統計情報 */}
            <div className="space-y-2">
              <Label
                style={{
                  color: 'hsl(340, 70%, 50%)',
                  fontWeight: '600',
                }}
              >
                📊 表示中
              </Label>
              <div className="flex items-center gap-2">
                <Users
                  className="h-4 w-4 animate-float"
                  style={{ color: 'hsl(180, 70%, 75%)' }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: 'hsl(340, 70%, 50%)' }}
                >
                  {filteredAssignments.length} 件
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* スケジュールグリッド */}
      <Card
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid hsl(350, 80%, 90%)',
          borderRadius: '12px',
        }}
      >
        <CardHeader className="print:pb-4">
          <CardTitle
            className="text-center text-xl"
            style={{
              color: 'hsl(340, 80%, 45%)',
              fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
            }}
          >
            📋{' '}
            {term === 'FIRST_TERM'
              ? '前期'
              : term === 'SECOND_TERM'
                ? '後期'
                : ''}
            図書委員当番表
          </CardTitle>
          <CardDescription
            className="text-center print:hidden"
            style={{ color: 'hsl(340, 60%, 50%)' }}
          >
            {filteredAssignments.length > 0
              ? `${filteredAssignments.length}件の当番が表示されています`
              : '当番データがありません'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 print:text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: 'hsl(180, 80%, 95%)',
                  }}
                >
                  <th
                    className="border border-gray-300 p-2 text-center font-medium"
                    style={{
                      color: 'hsl(340, 80%, 45%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    📚 図書室
                  </th>
                  {[1, 2, 3, 4, 5].map((day) => (
                    <th
                      key={day}
                      className="border border-gray-300 p-2 text-center font-medium min-w-[120px]"
                      style={{
                        color: 'hsl(340, 80%, 45%)',
                        fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                      }}
                    >
                      <div className="hidden sm:block">{dayNames[day]}</div>
                      <div className="sm:hidden">{shortDayNames[day]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-muted/50">
                    <td
                      className="border border-gray-300 p-2 font-medium"
                      style={{
                        backgroundColor: 'hsl(180, 80%, 97%)',
                        color: 'hsl(340, 70%, 50%)',
                      }}
                    >
                      <div className="text-sm">
                        {room.name}
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs print:hidden"
                          style={{
                            borderColor: 'hsl(180, 70%, 75%)',
                            color: 'hsl(340, 60%, 60%)',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          }}
                        >
                          定員{room.capacity}名
                        </Badge>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map((day) => (
                      <td
                        key={day}
                        className="border border-gray-300 p-1 align-top"
                      >
                        <div className="space-y-1">
                          {(weeklyGrid[day][room.name] || []).map(
                            (assignment) => (
                              <div
                                key={assignment.id}
                                className="p-2 rounded text-sm border animate-fadeIn"
                                style={{
                                  backgroundColor: 'hsl(140, 60%, 95%)',
                                  borderColor: 'hsl(140, 50%, 75%)',
                                  color: 'hsl(340, 70%, 50%)',
                                }}
                              >
                                <div className="font-medium">
                                  {assignment.student.name}
                                </div>
                                <div
                                  className="text-xs"
                                  style={{ color: 'hsl(340, 50%, 60%)' }}
                                >
                                  {assignment.student.grade}年
                                  {assignment.student.class.name}組
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 印刷用スタイル */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:pb-4 {
            padding-bottom: 1rem;
          }
          .print\\:text-sm {
            font-size: 0.875rem;
          }

          /* A4サイズに最適化 */
          @page {
            size: A4 landscape;
            margin: 1cm;
          }

          /* テーブルの改ページ制御 */
          table {
            page-break-inside: avoid;
          }

          /* ヘッダーの改ページ制御 */
          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </div>
  )
}
