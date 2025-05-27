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
import { Library, librariesApi } from '@/services/api';
import { PlusIcon, Pencil, Trash2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LibrariesTable() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentLibrary, setCurrentLibrary] = useState<Partial<Library> | null>(null);
  const [libraryToDelete, setLibraryToDelete] = useState<Library | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmSaveDialogOpen, setConfirmSaveDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const { toast } = useToast();

  const loadLibraries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await librariesApi.getAll();
      setLibraries(data);
    } catch (error) {
      console.error('図書館データの取得に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '図書館データの取得に失敗しました。'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLibraries();
  }, [loadLibraries]);

  const handleAdd = () => {
    setCurrentLibrary({
      name: '',
      location: '',
      capacity: 0,
      is_active: true,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (library: Library) => {
    setCurrentLibrary(library);
    setEditDialogOpen(true);
  };

  const handleDelete = (library: Library) => {
    setLibraryToDelete(library);
    setDeleteDialogOpen(true);
  };

  const confirmSaveAction = () => {
    if (!currentLibrary?.name) {
      setDialogMessage('図書室名は必須です。');
      setErrorDialogOpen(true);
      return;
    }

    setDialogMessage(currentLibrary.id ? '図書室情報を更新します。よろしいですか？' : '図書室情報を登録します。よろしいですか？');
    setConfirmSaveDialogOpen(true);
  };

  const handleSave = async () => {
    setConfirmSaveDialogOpen(false);
    try {
      setSaving(true);
      
      if (!currentLibrary) return;
      
      if (currentLibrary.id) {
        // 更新
        await librariesApi.update(currentLibrary.id, currentLibrary);
        setDialogMessage('図書室情報を更新しました。');
      } else {
        // 新規作成
        await librariesApi.create(currentLibrary as Omit<Library, 'id'>);
        setDialogMessage('図書室情報を登録しました。');
      }
      
      setEditDialogOpen(false);
      setCurrentLibrary(null);
      await loadLibraries();
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error('図書室情報の保存に失敗しました:', error);
      setDialogMessage('図書室情報の保存に失敗しました。');
      setErrorDialogOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!libraryToDelete) return;

    try {
      await librariesApi.delete(libraryToDelete.id);
      setDialogMessage('図書室情報を削除しました。');
      setDeleteDialogOpen(false);
      setLibraryToDelete(null);
      await loadLibraries();
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error('図書室情報の削除に失敗しました:', error);
      setDialogMessage('図書室情報の削除に失敗しました。');
      setErrorDialogOpen(true);
    }
  };

  const filteredLibraries = libraries.filter(library =>
    library.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (library.location && library.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <Input
          placeholder="図書室名で検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAdd}>
          <PlusIcon className="mr-2 h-4 w-4" /> 新規図書室
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">図書室名</TableHead>
              <TableHead className="w-[150px]">場所</TableHead>
              <TableHead className="w-[100px]">収容人数</TableHead>
              <TableHead className="w-[100px]">状態</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLibraries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  図書室情報がありません
                </TableCell>
              </TableRow>
            ) : (
              filteredLibraries.map((library) => (
                <TableRow key={library.id}>
                  <TableCell className="font-medium">{library.name}</TableCell>
                  <TableCell>{library.location || '-'}</TableCell>
                  <TableCell>{library.capacity || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      library.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {library.is_active ? 'アクティブ' : '無効'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(library)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(library)}
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
        <DialogContent className="bg-white rounded-xl border-2 border-teal-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-teal-700 flex items-center">
              {currentLibrary?.id ? (
                <>
                  <Pencil className="h-5 w-5 mr-2 text-teal-500" /> 図書室を編集
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 mr-2 text-teal-500" /> 新規図書室追加
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">図書室名</Label>
              <Input
                id="name"
                value={currentLibrary?.name || ''}
                onChange={(e) => setCurrentLibrary(prev => ({
                  ...prev,
                  name: e.target.value,
                }))}
                placeholder="図書室名を入力してください"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">場所</Label>
              <Input
                id="location"
                value={currentLibrary?.location || ''}
                onChange={(e) => setCurrentLibrary(prev => ({
                  ...prev,
                  location: e.target.value,
                }))}
                placeholder="場所を入力してください"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">収容人数</Label>
              <Input
                id="capacity"
                type="number"
                value={currentLibrary?.capacity || ''}
                onChange={(e) => setCurrentLibrary(prev => ({
                  ...prev,
                  capacity: e.target.value ? parseInt(e.target.value) : 0,
                }))}
                placeholder="収容人数を入力してください"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="is_active"
                type="checkbox"
                checked={currentLibrary?.is_active || false}
                onChange={(e) => setCurrentLibrary(prev => ({
                  ...prev,
                  is_active: e.target.checked,
                }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_active">アクティブ</Label>
            </div>
          </div>
          <DialogFooter>
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
              <Trash2 className="h-5 w-5 mr-2 text-pink-500" /> 図書室の削除
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">「{libraryToDelete?.name}」を削除してもよろしいですか？</p>
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
