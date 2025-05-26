'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Class, classesApi, Grade, gradesApi } from '@/services/api';
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClassesTable() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<Partial<Class> | null>(null);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, gradesData] = await Promise.all([
        classesApi.getAll(),
        gradesApi.getAll(),
      ]);
      setClasses(classesData);
      setGrades(gradesData);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'データの取得に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentClass({
      name: '',
      grade_id: grades.length > 0 ? grades[0].id : 0,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (classItem: Class) => {
    setCurrentClass(classItem);
    setEditDialogOpen(true);
  };

  const handleDelete = (classItem: Class) => {
    setClassToDelete(classItem);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentClass?.name || !currentClass?.grade_id) {
      toast({
        title: 'エラー',
        description: 'クラス名と学年は必須です。',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      if (currentClass.id) {
        // 更新
        await classesApi.update(currentClass.id, currentClass);
        toast({
          title: '成功',
          description: 'クラス情報を更新しました。',
        });
      } else {
        // 新規作成
        await classesApi.create(currentClass as Omit<Class, 'id'>);
        toast({
          title: '成功',
          description: 'クラス情報を作成しました。',
        });
      }
      
      setEditDialogOpen(false);
      setCurrentClass(null);
      await loadData();
    } catch (error) {
      console.error('クラス情報の保存に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'クラス情報の保存に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;

    try {
      await classesApi.delete(classToDelete.id);
      toast({
        title: '成功',
        description: 'クラス情報を削除しました。',
      });
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      await loadData();
    } catch (error) {
      console.error('クラス情報の削除に失敗しました:', error);
      toast({
        title: 'エラー',
        description: 'クラス情報の削除に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  const getGradeName = (gradeId: number) => {
    const grade = grades.find(g => g.id === gradeId);
    return grade ? grade.name : `学年${gradeId}`;
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === '' || classItem.grade_id.toString() === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <Input
            placeholder="クラス名で検索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全ての学年</option>
            {grades.map(grade => (
              <option key={grade.id} value={grade.id.toString()}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleAdd}>
          <PlusIcon className="mr-2 h-4 w-4" /> 新規クラス
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">学年</TableHead>
              <TableHead className="w-[200px]">クラス名</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  クラス情報がありません
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{getGradeName(classItem.grade_id)}</TableCell>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(classItem)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(classItem)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentClass?.id ? 'クラスを編集' : '新規クラス追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade_id">学年</Label>
              <select
                id="grade_id"
                value={currentClass?.grade_id || ''}
                onChange={(e) => setCurrentClass(prev => ({
                  ...prev,
                  grade_id: parseInt(e.target.value),
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {grades.map(grade => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">クラス名</Label>
              <Input
                id="name"
                value={currentClass?.name || ''}
                onChange={(e) => setCurrentClass(prev => ({
                  ...prev,
                  name: e.target.value,
                }))}
                placeholder="クラス名を入力してください"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>クラスの削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>「{classToDelete?.name}」を削除してもよろしいですか？</p>
            <p className="text-sm text-gray-500 mt-2">この操作は取り消せません。</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
