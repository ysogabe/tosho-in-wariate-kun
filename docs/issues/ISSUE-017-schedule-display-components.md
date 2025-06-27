# Issue #017: スケジュール表示コンポーネントの作成

**Priority**: High  
**Difficulty**: Intermediate  
**Estimated Time**: 5-7 hours  
**Type**: Frontend  
**Labels**: frontend, components, schedule, ui

## Description

当番表を表示するためのコンポーネントを作成します。週間グリッド表示、カレンダー表示、リスト表示など、複数の表示形式に対応した柔軟で見やすいスケジュール表示システムを実装します。

## Background

フロントエンド設計書で定義されたスケジュール表示要件に基づき、教員が当番表を確認しやすく、A4印刷にも対応した高品質な表示コンポーネントを作成します。

## Acceptance Criteria

- [ ] ScheduleGridコンポーネントが作成されている
- [ ] ScheduleCalendarコンポーネントが作成されている
- [ ] ScheduleListコンポーネントが作成されている
- [ ] 印刷対応スタイルが実装されている
- [ ] レスポンシブ対応が実装されている
- [ ] フィルタ・検索機能が実装されている
- [ ] エクスポート機能との連携が実装されている
- [ ] TypeScript型定義が完了している

## Implementation Guidelines

### Getting Started

1. Issue #008（テーブルコンポーネント）が完了していることを確認
2. Issue #015（スケジュールAPI）が完了していることを確認
3. スケジュールデータ構造の理解
4. 印刷対応CSSの確認

### Main Implementation

#### 1. Schedule Grid Component

##### src/components/schedule/schedule-grid.tsx

```typescript
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Download, Filter, Print, Search, Users } from 'lucide-react'
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
  className
}: ScheduleGridProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')

  // フィルタリングされた割り当て
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesSearch = !searchTerm ||
        assignment.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.room.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRoom = selectedRoom === 'all' || assignment.room.id === selectedRoom
      const matchesGrade = selectedGrade === 'all' || assignment.student.grade.toString() === selectedGrade

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

    filteredAssignments.forEach(assignment => {
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
    const roomSet = new Set(assignments.map(a => a.room.id))
    return assignments
      .filter(a => roomSet.has(a.room.id))
      .map(a => a.room)
      .filter((room, index, arr) => arr.findIndex(r => r.id === room.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* コントロールパネル */}
      <Card className="print:hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                当番表表示設定
              </CardTitle>
              <CardDescription>
                表示する内容をフィルタリングできます
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Print className="mr-2 h-4 w-4" />
                印刷
              </Button>
              {onExport && (
                <Select onValueChange={onExport}>
                  <SelectTrigger className="w-32">
                    <Download className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="出力" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
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
              <Label htmlFor="search">検索</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="名前・図書室で検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* 図書室フィルタ */}
            <div className="space-y-2">
              <Label>図書室</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
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
              <Label>学年</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
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
              <Label>表示中</Label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {filteredAssignments.length} 件
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* スケジュールグリッド */}
      <Card>
        <CardHeader className="print:pb-4">
          <CardTitle className="text-center text-xl">
            {term === 'FIRST_TERM' ? '前期' : term === 'SECOND_TERM' ? '後期' : ''}
            図書委員当番表
          </CardTitle>
          <CardDescription className="text-center print:hidden">
            {filteredAssignments.length > 0 ?
              `${filteredAssignments.length}件の当番が表示されています` :
              '当番データがありません'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 print:text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-gray-300 p-2 text-center font-medium">
                    図書室
                  </th>
                  {[1, 2, 3, 4, 5].map((day) => (
                    <th key={day} className="border border-gray-300 p-2 text-center font-medium min-w-[120px]">
                      <div className="hidden sm:block">{dayNames[day]}</div>
                      <div className="sm:hidden">{shortDayNames[day]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-muted/50">
                    <td className="border border-gray-300 p-2 font-medium bg-muted/30">
                      <div className="text-sm">
                        {room.name}
                        <Badge variant="outline" className="ml-2 text-xs print:hidden">
                          定員{room.capacity}名
                        </Badge>
                      </div>
                    </td>
                    {[1, 2, 3, 4, 5].map((day) => (
                      <td key={day} className="border border-gray-300 p-1 align-top">
                        <div className="space-y-1">
                          {(weeklyGrid[day][room.name] || []).map((assignment) => (
                            <div
                              key={assignment.id}
                              className="p-2 bg-primary/10 rounded text-sm border"
                            >
                              <div className="font-medium">
                                {assignment.student.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.student.grade}年{assignment.student.class.name}組
                              </div>
                            </div>
                          ))}
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
```

#### 2. Schedule Calendar Component

##### src/components/schedule/schedule-calendar.tsx

```typescript
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react'
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

interface ScheduleCalendarProps {
  assignments: Assignment[]
  term?: 'FIRST_TERM' | 'SECOND_TERM'
  className?: string
}

const dayNames = ['日', '月', '火', '水', '木', '金', '土']
const monthNames = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

export function ScheduleCalendar({
  assignments,
  term,
  className
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedRoom, setSelectedRoom] = useState<string>('all')

  // フィルタリングされた割り当て
  const filteredAssignments = useMemo(() => {
    return assignments.filter(assignment => {
      const matchesRoom = selectedRoom === 'all' || assignment.room.id === selectedRoom
      return matchesRoom
    })
  }, [assignments, selectedRoom])

  // 図書室一覧
  const rooms = useMemo(() => {
    const roomSet = new Set(assignments.map(a => a.room.id))
    return assignments
      .filter(a => roomSet.has(a.room.id))
      .map(a => a.room)
      .filter((room, index, arr) => arr.findIndex(r => r.id === room.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  // カレンダーデータ生成
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const weeks = []
    let currentWeek = []

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      // その日の当番を取得
      const dayOfWeek = date.getDay()
      const assignmentsForDay = dayOfWeek >= 1 && dayOfWeek <= 5 &&
        date >= firstDay && date <= lastDay
        ? filteredAssignments.filter(a => a.dayOfWeek === dayOfWeek)
        : []

      currentWeek.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === new Date().toDateString(),
        assignments: assignmentsForDay,
      })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    return weeks
  }, [currentDate, filteredAssignments])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* カレンダーヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {currentDate.getFullYear()}年{monthNames[currentDate.getMonth()]}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {term && (
                <Badge variant="secondary">
                  {term === 'FIRST_TERM' ? '前期' : '後期'}
                </Badge>
              )}
            </div>

            {/* 図書室フィルタ */}
            <div className="flex items-center gap-2">
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="図書室選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての図書室</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* カレンダーグリッド */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {/* 曜日ヘッダー */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-medium text-sm bg-muted rounded"
              >
                {day}
              </div>
            ))}

            {/* カレンダー本体 */}
            {calendarData.map((week, weekIndex) =>
              week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn(
                    'min-h-[100px] p-1 border border-border rounded',
                    {
                      'bg-muted/30': !day.isCurrentMonth,
                      'bg-primary/10': day.isToday,
                      'bg-background': day.isCurrentMonth && !day.isToday,
                    }
                  )}
                >
                  <div className="text-sm font-medium mb-1">
                    {day.date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {day.assignments.slice(0, 3).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-1 bg-primary/20 rounded text-xs"
                      >
                        <div className="font-medium truncate">
                          {assignment.student.name}
                        </div>
                        <div className="text-muted-foreground truncate">
                          {assignment.room.name}
                        </div>
                      </div>
                    ))}

                    {day.assignments.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{day.assignments.length - 3}件
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 凡例 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/10 rounded border"></div>
              <span>今日</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/20 rounded"></div>
              <span>当番日</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>総当番数: {filteredAssignments.length}件</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 3. Schedule List Component

##### src/components/schedule/schedule-list.tsx

```typescript
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, Clock, MapPin, Search, User, Users } from 'lucide-react'
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

interface ScheduleListProps {
  assignments: Assignment[]
  term?: 'FIRST_TERM' | 'SECOND_TERM'
  className?: string
}

const dayNames = ['', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日']

export function ScheduleList({
  assignments,
  term,
  className
}: ScheduleListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('day')

  // フィルタリングとソート
  const filteredAndSortedAssignments = useMemo(() => {
    let filtered = assignments.filter(assignment => {
      const matchesSearch = !searchTerm ||
        assignment.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.room.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDay = selectedDay === 'all' || assignment.dayOfWeek.toString() === selectedDay
      const matchesRoom = selectedRoom === 'all' || assignment.room.id === selectedRoom
      const matchesGrade = selectedGrade === 'all' || assignment.student.grade.toString() === selectedGrade

      return matchesSearch && matchesDay && matchesRoom && matchesGrade
    })

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'day':
          return a.dayOfWeek - b.dayOfWeek
        case 'name':
          return a.student.name.localeCompare(b.student.name)
        case 'room':
          return a.room.name.localeCompare(b.room.name)
        case 'grade':
          return a.student.grade - b.student.grade
        default:
          return 0
      }
    })

    return filtered
  }, [assignments, searchTerm, selectedDay, selectedRoom, selectedGrade, sortBy])

  // 図書室一覧
  const rooms = useMemo(() => {
    const roomSet = new Set(assignments.map(a => a.room.id))
    return assignments
      .filter(a => roomSet.has(a.room.id))
      .map(a => a.room)
      .filter((room, index, arr) => arr.findIndex(r => r.id === room.id) === index)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [assignments])

  // 統計情報
  const statistics = useMemo(() => {
    const stats = {
      total: filteredAndSortedAssignments.length,
      byDay: {} as Record<number, number>,
      byRoom: {} as Record<string, number>,
      byGrade: {} as Record<number, number>,
    }

    filteredAndSortedAssignments.forEach(assignment => {
      // 曜日別
      stats.byDay[assignment.dayOfWeek] = (stats.byDay[assignment.dayOfWeek] || 0) + 1

      // 図書室別
      stats.byRoom[assignment.room.name] = (stats.byRoom[assignment.room.name] || 0) + 1

      // 学年別
      stats.byGrade[assignment.student.grade] = (stats.byGrade[assignment.student.grade] || 0) + 1
    })

    return stats
  }, [filteredAndSortedAssignments])

  return (
    <div className={cn('space-y-4', className)}>
      {/* フィルタ・検索パネル */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            当番一覧
            {term && (
              <Badge variant="secondary">
                {term === 'FIRST_TERM' ? '前期' : '後期'}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {statistics.total}件の当番が表示されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 検索 */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="名前・図書室で検索"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* 曜日フィルタ */}
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger>
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="曜日" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {[1, 2, 3, 4, 5].map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {dayNames[day]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 図書室フィルタ */}
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger>
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue placeholder="図書室" />
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

            {/* 学年フィルタ */}
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="学年" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="5">5年生</SelectItem>
                <SelectItem value="6">6年生</SelectItem>
              </SelectContent>
            </Select>

            {/* ソート */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="並び順" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">曜日順</SelectItem>
                <SelectItem value="name">名前順</SelectItem>
                <SelectItem value="room">図書室順</SelectItem>
                <SelectItem value="grade">学年順</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-sm text-muted-foreground">総当番数</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Object.keys(statistics.byDay).length}
            </div>
            <p className="text-sm text-muted-foreground">活動曜日数</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Object.keys(statistics.byRoom).length}
            </div>
            <p className="text-sm text-muted-foreground">使用図書室数</p>
          </CardContent>
        </Card>
      </div>

      {/* 当番リスト */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredAndSortedAssignments.map((assignment) => (
              <div key={assignment.id} className="p-4 hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {assignment.student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="font-medium">
                        {assignment.student.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.student.grade}年{assignment.student.class.name}組
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        {dayNames[assignment.dayOfWeek]}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {assignment.room.name}
                      </div>
                    </div>

                    <Badge variant="outline">
                      {term === 'FIRST_TERM' ? '前期' : '後期'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {filteredAndSortedAssignments.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                条件に一致する当番が見つかりません
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Resources

- [CSS Print Styles](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)
- [React Calendar Libraries](https://react-calendar.js.org/)
- [Table Design Patterns](https://inclusive-components.design/data-tables/)

## Implementation Results

### Work Completed

- [ ] ScheduleGridコンポーネント実装
- [ ] ScheduleCalendarコンポーネント実装
- [ ] ScheduleListコンポーネント実装
- [ ] フィルタ・検索機能実装
- [ ] 印刷対応スタイル実装
- [ ] レスポンシブ対応実装
- [ ] 統計情報表示実装

### Testing Results

- [ ] グリッド表示確認
- [ ] カレンダー表示確認
- [ ] リスト表示確認
- [ ] フィルタ機能確認
- [ ] 印刷表示確認
- [ ] レスポンシブ表示確認

### Code Review Feedback

<!-- コードレビューでの指摘事項と対応を記録 -->

## Next Steps

このIssue完了後の次のタスク：

1. Issue #018: スケジュール管理ページ実装
2. Issue #019: クラス管理ページ実装
3. Issue #020: 図書委員管理ページ実装
