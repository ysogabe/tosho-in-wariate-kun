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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Calendar, MapPin, Search, User, Users } from 'lucide-react'
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
  className,
}: ScheduleListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('day')

  // フィルタリングとソート
  const filteredAndSortedAssignments = useMemo(() => {
    const filtered = assignments.filter((assignment) => {
      const matchesSearch =
        !searchTerm ||
        assignment.student.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        assignment.room.name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDay =
        selectedDay === 'all' || assignment.dayOfWeek.toString() === selectedDay
      const matchesRoom =
        selectedRoom === 'all' || assignment.room.id === selectedRoom
      const matchesGrade =
        selectedGrade === 'all' ||
        assignment.student.grade.toString() === selectedGrade

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
  }, [
    assignments,
    searchTerm,
    selectedDay,
    selectedRoom,
    selectedGrade,
    sortBy,
  ])

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

  // 統計情報
  const statistics = useMemo(() => {
    const stats = {
      total: filteredAndSortedAssignments.length,
      byDay: {} as Record<number, number>,
      byRoom: {} as Record<string, number>,
      byGrade: {} as Record<number, number>,
    }

    filteredAndSortedAssignments.forEach((assignment) => {
      // 曜日別
      stats.byDay[assignment.dayOfWeek] =
        (stats.byDay[assignment.dayOfWeek] || 0) + 1

      // 図書室別
      stats.byRoom[assignment.room.name] =
        (stats.byRoom[assignment.room.name] || 0) + 1

      // 学年別
      stats.byGrade[assignment.student.grade] =
        (stats.byGrade[assignment.student.grade] || 0) + 1
    })

    return stats
  }, [filteredAndSortedAssignments])

  return (
    <div className={cn('space-y-4', className)}>
      {/* フィルタ・検索パネル */}
      <Card
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '2px solid hsl(350, 80%, 90%)',
          borderRadius: '12px',
        }}
      >
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2"
            style={{
              color: 'hsl(340, 80%, 45%)',
              fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
            }}
          >
            <Users
              className="h-5 w-5 animate-float"
              style={{ color: 'hsl(180, 70%, 75%)' }}
            />
            👥 当番一覧
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
          </CardTitle>
          <CardDescription style={{ color: 'hsl(340, 60%, 50%)' }}>
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
                className="pl-8 rounded-md"
                style={{
                  borderColor: 'hsl(180, 70%, 85%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
              />
            </div>

            {/* 曜日フィルタ */}
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger
                className="rounded-md"
                style={{
                  borderColor: 'hsl(180, 70%, 85%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="📅 曜日" />
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
              <SelectTrigger
                className="rounded-md"
                style={{
                  borderColor: 'hsl(180, 70%, 85%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue placeholder="📚 図書室" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    📚 {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 学年フィルタ */}
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger
                className="rounded-md"
                style={{
                  borderColor: 'hsl(180, 70%, 85%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="🎒 学年" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="5">5年生</SelectItem>
                <SelectItem value="6">6年生</SelectItem>
              </SelectContent>
            </Select>

            {/* ソート */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                className="rounded-md"
                style={{
                  borderColor: 'hsl(180, 70%, 85%)',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                }}
              >
                <SelectValue placeholder="📊 並び順" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">📅 曜日順</SelectItem>
                <SelectItem value="name">👤 名前順</SelectItem>
                <SelectItem value="room">📚 図書室順</SelectItem>
                <SelectItem value="grade">🎒 学年順</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          style={{
            backgroundColor: 'hsl(200, 100%, 95%)',
            border: '2px dashed hsl(200, 70%, 70%)',
            borderRadius: '12px',
          }}
        >
          <CardContent className="p-4">
            <div
              className="text-2xl font-bold"
              style={{
                color: 'hsl(340, 80%, 45%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              {statistics.total}
            </div>
            <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
              📊 総当番数
            </p>
          </CardContent>
        </Card>

        <Card
          style={{
            backgroundColor: 'hsl(140, 100%, 95%)',
            border: '2px dashed hsl(140, 70%, 70%)',
            borderRadius: '12px',
          }}
        >
          <CardContent className="p-4">
            <div
              className="text-2xl font-bold"
              style={{
                color: 'hsl(340, 80%, 45%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              {Object.keys(statistics.byDay).length}
            </div>
            <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
              📅 活動曜日数
            </p>
          </CardContent>
        </Card>

        <Card
          style={{
            backgroundColor: 'hsl(280, 100%, 95%)',
            border: '2px dashed hsl(280, 70%, 70%)',
            borderRadius: '12px',
          }}
        >
          <CardContent className="p-4">
            <div
              className="text-2xl font-bold"
              style={{
                color: 'hsl(340, 80%, 45%)',
                fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
              }}
            >
              {Object.keys(statistics.byRoom).length}
            </div>
            <p className="text-sm" style={{ color: 'hsl(340, 60%, 50%)' }}>
              📚 使用図書室数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 当番リスト */}
      <Card
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid hsl(350, 80%, 90%)',
          borderRadius: '12px',
        }}
      >
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredAndSortedAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 hover:bg-muted/50 animate-fadeIn"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      style={{
                        backgroundColor: 'hsl(180, 70%, 95%)',
                        border: '2px solid hsl(180, 70%, 75%)',
                      }}
                    >
                      <AvatarFallback
                        style={{
                          color: 'hsl(340, 70%, 50%)',
                          fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                          fontSize: '1.2rem',
                        }}
                      >
                        {assignment.student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div
                        className="font-medium"
                        style={{
                          color: 'hsl(340, 80%, 45%)',
                          fontFamily: '"Comic Sans MS", "Segoe UI", sans-serif',
                        }}
                      >
                        👤 {assignment.student.name}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: 'hsl(340, 60%, 50%)' }}
                      >
                        🎒 {assignment.student.grade}年
                        {assignment.student.class.name}組
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className="flex items-center gap-1 text-sm"
                        style={{ color: 'hsl(340, 70%, 50%)' }}
                      >
                        <Calendar className="h-4 w-4" />
                        📅 {dayNames[assignment.dayOfWeek]}
                      </div>
                      <div
                        className="flex items-center gap-1 text-sm"
                        style={{ color: 'hsl(340, 60%, 50%)' }}
                      >
                        <MapPin className="h-4 w-4" />
                        📚 {assignment.room.name}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: 'hsl(140, 60%, 95%)',
                        color: 'hsl(340, 70%, 50%)',
                        borderColor: 'hsl(140, 50%, 75%)',
                      }}
                    >
                      {term === 'FIRST_TERM' ? '🌸 前期' : '🍂 後期'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {filteredAndSortedAssignments.length === 0 && (
              <div
                className="p-8 text-center"
                style={{ color: 'hsl(340, 50%, 60%)' }}
              >
                😅 条件に一致する当番が見つかりません
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
