'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { PlusIcon, Pencil, Trash2, CheckCircle, AlertCircle, Save } from 'lucide-react';
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
  const [confirmSaveDialogOpen, setConfirmSaveDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const { toast } = useToast();

  const loadData = useCallback(async () => {
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
  }, [toast]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const confirmSaveAction = () => {
    if (!currentClass?.name || !currentClass?.grade_id) {
      setDialogMessage('クラス名と学年は必須です。');
      setErrorDialogOpen(true);
      return;
    }

    setDialogMessage(currentClass.id ? 'クラス情報を更新します。よろしいですか？' : 'クラス情報を登録します。よろしいですか？');
    setConfirmSaveDialogOpen(true);
  };

  const handleSave = async () => {
    setConfirmSaveDialogOpen(false);
    try {
      setSaving(true);
      
      if (!currentClass) return;
      
      if (currentClass.id) {
        // 更新
        await classesApi.update(currentClass.id, currentClass);
        setDialogMessage('クラス情報を更新しました。');
      } else {
        // 新規作成
        await classesApi.create(currentClass as Omit<Class, 'id'>);
        setDialogMessage('クラス情報を登録しました。');
      }
      
      setEditDialogOpen(false);
      setCurrentClass(null);
      await loadData();
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error('クラス情報の保存に失敗しました:', error);
      setDialogMessage('クラス情報の保存に失敗しました。');
      setErrorDialogOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;

    try {
      await classesApi.delete(classToDelete.id);
      setDialogMessage('クラス情報を削除しました。');
      setDeleteDialogOpen(false);
      setClassToDelete(null);
      await loadData();
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error('クラス情報の削除に失敗しました:', error);
      setDialogMessage('クラス情報の削除に失敗しました。');
      setErrorDialogOpen(true);
    }
  };

  const getGradeName = (gradeId: number) => {
    const grade = grades.find(g => g.id === gradeId);
    return grade ? grade.name : `学年${gradeId}`;
  };

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter ? classItem.grade_id === parseInt(gradeFilter) : true;
    return matchesSearch && matchesGrade;
  });

  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const gradeA = grades.find(g => g.id === a.grade_id)?.name || '';
    const gradeB = grades.find(g => g.id === b.grade_id)?.name || '';
    if (gradeA !== gradeB) return gradeA.localeCompare(gradeB);
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white bg-opacity-90 rounded-xl border-2 border-dashed border-pink-200">
      <h2 className="text-xl font-bold text-pink-700 mb-6 flex items-center">
        <span className="text-pink-500 mr-2 text-2xl">👨‍🎓</span> クラス管理
      </h2>
      
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="クラス名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 border-teal-100 focus:border-teal-200 rounded-full h-10"
            />
            <div className="absolute left-3 top-2.5 text-teal-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          
          <div className="relative">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border-2 border-teal-100 focus:border-teal-200 rounded-full h-10 bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 text-gray-700"
            >
              <option value="">全ての学年</option>
              {grades.map(grade => (
                <option key={grade.id} value={grade.id.toString()}>
                  {grade.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-3 text-teal-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleAdd}
          className="bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-full px-4 h-10 flex items-center gap-1 border-2 border-teal-200"
        >
          <PlusIcon className="h-4 w-4" /> 新規クラス
        </Button>
      </div>

      <div className="border-2 border-gray-100 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-center w-1/4 text-gray-600 font-semibold">学年</TableHead>
              <TableHead className="text-center w-1/2 text-gray-600 font-semibold">クラス名</TableHead>
              <TableHead className="text-center w-1/4 text-gray-600 font-semibold">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  データを読み込み中...
                </TableCell>
              </TableRow>
            ) : sortedClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                  クラス情報がありません
                </TableCell>
              </TableRow>
            ) : (
              sortedClasses.map((classItem) => (
                <TableRow key={classItem.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium text-center">{getGradeName(classItem.grade_id)}</TableCell>
                  <TableCell className="text-center">{classItem.name}</TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(classItem)}
                        className="rounded-full w-8 h-8 p-0 border-teal-200 hover:border-teal-300 hover:bg-teal-50"
                      >
                        <Pencil className="h-4 w-4 text-teal-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(classItem)}
                        className="rounded-full w-8 h-8 p-0 border-pink-200 hover:border-pink-300 hover:bg-pink-50"
                      >
                        <Trash2 className="h-4 w-4 text-pink-600" />
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
        <DialogContent className="bg-white rounded-xl border-2 border-teal-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-teal-700 flex items-center">
              {currentClass?.id ? (
                <>
                  <Pencil className="h-5 w-5 mr-2 text-teal-500" /> クラスを編集
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2 text-teal-500" /> 新規クラス追加
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="grade_id" className="text-gray-700 font-medium">学年</Label>
              <div className="relative">
                <select
                  id="grade_id"
                  value={currentClass?.grade_id || ''}
                  onChange={(e) => setCurrentClass(prev => ({
                    ...prev,
                    grade_id: parseInt(e.target.value),
                  }))}
                  className="w-full appearance-none px-4 py-2 border-2 border-teal-100 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-200 pr-10"
                >
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-2.5 text-teal-400 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">クラス名</Label>
              <Input
                id="name"
                value={currentClass?.name || ''}
                onChange={(e) => setCurrentClass(prev => ({
                  ...prev,
                  name: e.target.value,
                }))}
                placeholder="クラス名を入力してください"
                className="border-2 border-teal-100 focus:border-teal-200 rounded-md"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              キャンセル
            </Button>
            <Button 
              onClick={confirmSaveAction} 
              disabled={saving}
              className="rounded-full bg-teal-500 hover:bg-teal-600 text-white"
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white rounded-xl border-2 border-pink-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-pink-700 flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-pink-500" /> クラスの削除
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">「{classToDelete?.name}」を削除してもよろしいですか？</p>
            <p className="text-sm text-gray-500 mt-2">この操作は取り消せません。</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              キャンセル
            </Button>
            <Button 
              variant="outline" 
              onClick={confirmDelete}
              className="rounded-full bg-pink-500 hover:bg-pink-600 text-white border-pink-400"
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 保存確認ダイアログ */}
      <Dialog open={confirmSaveDialogOpen} onOpenChange={setConfirmSaveDialogOpen}>
        <DialogContent className="bg-white rounded-xl border-2 border-teal-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-teal-700 flex items-center">
              <Save className="h-5 w-5 mr-2 text-teal-500" /> 保存の確認
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{dialogMessage}</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConfirmSaveDialogOpen(false)}
              className="rounded-full border-gray-300 hover:bg-gray-100 text-gray-700"
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSave} 
              className="rounded-full bg-teal-500 hover:bg-teal-600 text-white"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 成功ダイアログ */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="bg-white rounded-xl border-2 border-teal-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-teal-700 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-teal-500" /> 成功
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{dialogMessage}</p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setSuccessDialogOpen(false)} 
              className="rounded-full bg-teal-500 hover:bg-teal-600 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* エラーダイアログ */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="bg-white rounded-xl border-2 border-pink-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-pink-700 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-pink-500" /> エラー
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{dialogMessage}</p>
            <p className="text-sm text-gray-500 mt-2">もう一度お試しいただくか、管理者にお問い合わせください。</p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setErrorDialogOpen(false)} 
              className="rounded-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
