'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import {
  classesColumns,
  sampleClassesData,
  type ClassData,
} from '@/components/table/classes-columns'
import {
  studentsColumns,
  sampleStudentsData,
  type StudentData,
} from '@/components/table/students-columns'
import { Plus, Download, Settings, FileText } from 'lucide-react'

export default function TableTestPage() {
  const [selectedClasses, setSelectedClasses] = useState<ClassData[]>([])
  const [selectedStudents, setSelectedStudents] = useState<StudentData[]>([])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            テーブルコンポーネントテスト
          </h1>
          <p className="text-muted-foreground">
            DataTableコンポーネントの動作確認とデモ
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規追加
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            エクスポート
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* 概要カード */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">クラス総数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sampleClassesData.length}
              </div>
              <p className="text-xs text-muted-foreground">
                アクティブ: {sampleClassesData.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                図書委員総数
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sampleStudentsData.length}
              </div>
              <p className="text-xs text-muted-foreground">
                アクティブ:{' '}
                {sampleStudentsData.filter((s) => s.isActive).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">選択クラス</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedClasses.length}</div>
              <p className="text-xs text-muted-foreground">
                クラステーブルで選択中
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                選択図書委員
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedStudents.length}
              </div>
              <p className="text-xs text-muted-foreground">
                図書委員テーブルで選択中
              </p>
            </CardContent>
          </Card>
        </div>

        {/* クラステーブル */}
        <Card>
          <CardHeader>
            <CardTitle>クラス管理テーブル</CardTitle>
            <CardDescription>
              クラス情報の表示・検索・ソート・フィルタ機能のデモ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={classesColumns}
              data={sampleClassesData}
              searchKey="name"
              searchPlaceholder="クラス名で検索..."
              enableSelection={true}
              onSelectionChange={setSelectedClasses}
            />
          </CardContent>
        </Card>

        {/* 図書委員テーブル */}
        <Card>
          <CardHeader>
            <CardTitle>図書委員管理テーブル</CardTitle>
            <CardDescription>
              図書委員情報の表示・検索・ソート・フィルタ機能のデモ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={studentsColumns}
              data={sampleStudentsData}
              searchKey="name"
              searchPlaceholder="氏名で検索..."
              enableSelection={true}
              onSelectionChange={setSelectedStudents}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
