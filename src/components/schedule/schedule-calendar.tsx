'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
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
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
]

export function ScheduleCalendar({
  assignments,
  term,
  className,
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedRoom, setSelectedRoom] = useState<string>('all')

  // フィルタリングされた割り当て
  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesRoom =
        selectedRoom === 'all' || assignment.room.id === selectedRoom
      return matchesRoom
    })
  }, [assignments, selectedRoom])

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
      const assignmentsForDay =
        dayOfWeek >= 1 && dayOfWeek <= 5 && date >= firstDay && date <= lastDay
          ? filteredAssignments.filter((a) => a.dayOfWeek === dayOfWeek)
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
    setCurrentDate((prev) => {
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
      <Card
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '2px solid hsl(350, 80%, 90%)',
          borderRadius: '12px',
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300"
                  style={{
                    borderColor: 'hsl(180, 70%, 75%)',
                    color: 'hsl(340, 70%, 50%)',
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2
                  className="text-xl font-semibold"
                  style={{
                    color: 'hsl(340, 80%, 45%)',
                    fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                  }}
                >
                  📅 {currentDate.getFullYear()}年
                  {monthNames[currentDate.getMonth()]}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="bg-white rounded-full shadow-sm hover:shadow-md transition-all duration-300"
                  style={{
                    borderColor: 'hsl(180, 70%, 75%)',
                    color: 'hsl(340, 70%, 50%)',
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {term && (
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: 'hsl(140, 60%, 95%)',
                    color: 'hsl(340, 70%, 50%)',
                    borderColor: 'hsl(140, 50%, 75%)',
                  }}
                >
                  {term === 'FIRST_TERM' ? '🌸 前期' : '🍂 後期'}
                </Badge>
              )}
            </div>

            {/* 図書室フィルタ */}
            <div className="flex items-center gap-2">
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger
                  className="w-40 bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-300"
                  style={{
                    borderColor: 'hsl(180, 70%, 85%)',
                    color: 'hsl(340, 70%, 50%)',
                  }}
                >
                  <SelectValue placeholder="📚 図書室選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての図書室</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      📚 {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* カレンダーグリッド */}
      <Card
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid hsl(350, 80%, 90%)',
          borderRadius: '12px',
        }}
      >
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {/* 曜日ヘッダー */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-medium text-sm rounded"
                style={{
                  backgroundColor: 'hsl(180, 80%, 95%)',
                  color: 'hsl(340, 80%, 45%)',
                  fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                }}
              >
                {day}
              </div>
            ))}

            {/* カレンダー本体 */}
            {calendarData.map((week, weekIndex) =>
              week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={cn('min-h-[100px] p-1 border rounded', {
                    'bg-muted/30': !day.isCurrentMonth,
                    'bg-primary/10': day.isToday,
                    'bg-background': day.isCurrentMonth && !day.isToday,
                  })}
                  style={{
                    borderColor: 'hsl(180, 70%, 85%)',
                    backgroundColor: day.isToday
                      ? 'hsl(140, 80%, 95%)'
                      : day.isCurrentMonth
                        ? 'rgba(255, 255, 255, 0.8)'
                        : 'hsl(0, 0%, 95%)',
                  }}
                >
                  <div
                    className="text-sm font-medium mb-1"
                    style={{
                      color: 'hsl(340, 70%, 50%)',
                      fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                    }}
                  >
                    {day.date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {day.assignments.slice(0, 3).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-1 rounded text-xs animate-fadeIn"
                        style={{
                          backgroundColor: 'hsl(200, 60%, 95%)',
                          color: 'hsl(340, 70%, 50%)',
                          border: '1px solid hsl(200, 50%, 75%)',
                        }}
                      >
                        <div className="font-medium truncate">
                          {assignment.student.name}
                        </div>
                        <div
                          className="truncate"
                          style={{ color: 'hsl(340, 50%, 60%)' }}
                        >
                          {assignment.room.name}
                        </div>
                      </div>
                    ))}

                    {day.assignments.length > 3 && (
                      <div
                        className="text-xs"
                        style={{ color: 'hsl(340, 50%, 60%)' }}
                      >
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
      <Card
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '2px solid hsl(350, 80%, 90%)',
          borderRadius: '12px',
        }}
      >
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border"
                style={{
                  backgroundColor: 'hsl(140, 80%, 95%)',
                  borderColor: 'hsl(140, 50%, 75%)',
                }}
              ></div>
              <span style={{ color: 'hsl(340, 70%, 50%)' }}>✨ 今日</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{
                  backgroundColor: 'hsl(200, 60%, 95%)',
                  border: '1px solid hsl(200, 50%, 75%)',
                }}
              ></div>
              <span style={{ color: 'hsl(340, 70%, 50%)' }}>📋 当番日</span>
            </div>
            <div className="flex items-center gap-2">
              <Users
                className="h-4 w-4 animate-float"
                style={{ color: 'hsl(180, 70%, 75%)' }}
              />
              <span style={{ color: 'hsl(340, 70%, 50%)' }}>
                総当番数: {filteredAssignments.length}件
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
