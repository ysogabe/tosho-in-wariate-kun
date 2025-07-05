'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateStudentSchema,
  CreateStudentRequest,
} from '@/lib/schemas/student-schemas'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface CreateStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ClassOption {
  id: string
  name: string
  year: number
}

export function CreateStudentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateStudentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)

  const form = useForm<CreateStudentRequest>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: {
      name: '',
      grade: 5,
      classId: '',
      isActive: true,
    },
  })

  // クラス一覧を取得
  const fetchClasses = async () => {
    try {
      setLoadingClasses(true)
      const response = await fetch('/api/classes')

      if (!response.ok) {
        throw new Error('クラス一覧の取得に失敗しました')
      }

      const data = await response.json()
      const classOptions: ClassOption[] = data.data.classes.map((cls: any) => ({
        id: cls.id,
        name: `${cls.year}年${cls.name}`,
        year: cls.year,
      }))

      setClasses(classOptions)
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoadingClasses(false)
    }
  }

  // ダイアログが開かれたときにクラス一覧を取得
  useEffect(() => {
    if (open) {
      fetchClasses()
    }
  }, [open])

  const onSubmit = async (data: CreateStudentRequest) => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '図書委員の登録に失敗しました')
      }

      form.reset()
      onSuccess()
    } catch (error) {
      console.error('Failed to create student:', error)
      form.setError('root', {
        message:
          error instanceof Error
            ? error.message
            : '図書委員の登録に失敗しました',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  // 学年変更時にクラス選択をリセット
  const handleGradeChange = (grade: number) => {
    form.setValue('grade', grade)
    form.setValue('classId', '') // クラス選択をリセット
  }

  // 選択した学年に対応するクラスのみを表示
  const selectedGrade = form.watch('grade')
  const filteredClasses = classes.filter((cls) => cls.year === selectedGrade)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新しい図書委員を登録</DialogTitle>
          <DialogDescription>
            図書委員の情報を入力してください。
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>氏名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: 田中 太郎"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    図書委員の氏名を入力してください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>学年</FormLabel>
                  <Select
                    onValueChange={(value) => handleGradeChange(Number(value))}
                    defaultValue={field.value.toString()}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="学年を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">5年</SelectItem>
                      <SelectItem value="6">6年</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    図書委員の学年（5年または6年）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>クラス</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting || loadingClasses}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingClasses
                              ? 'クラス情報を読み込み中...'
                              : 'クラスを選択'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    図書委員が所属するクラスを選択してください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm font-medium text-red-500">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingClasses}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                登録
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
