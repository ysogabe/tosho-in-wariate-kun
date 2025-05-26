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
import { Library, librariesApi } from '@/services/api';
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
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
  const { toast } = useToast();

  useEffect(() => {
    loadLibraries();
  }, []);

  const loadLibraries = async () => {
    try {
      setLoading(true);
      const data = await librariesApi.getAll();
      setLibraries(data);
    } catch (error) {
      console.error('図書室情報の取得に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '図書室情報の取得に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!currentLibrary?.name) {
      toast({
        title: 'エラー',
        description: '図書室名は必須です。',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      if (currentLibrary.id) {
        // 更新
        await librariesApi.update(currentLibrary.id, currentLibrary);
        toast({
          title: '成功',
          description: '図書室情報を更新しました。',
        });
      } else {
        // 新規作成
        await librariesApi.create(currentLibrary as Omit<Library, 'id'>);
        toast({
          title: '成功',
          description: '図書室情報を作成しました。',
        });
      }
      
      setEditDialogOpen(false);
      setCurrentLibrary(null);
      await loadLibraries();
    } catch (error) {
      console.error('図書室情報の保存に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '図書室情報の保存に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!libraryToDelete) return;

    try {
      await librariesApi.delete(libraryToDelete.id);
      toast({
        title: '成功',
        description: '図書室情報を削除しました。',
      });
      setDeleteDialogOpen(false);
      setLibraryToDelete(null);
      await loadLibraries();
    } catch (error) {
      console.error('図書室情報の削除に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '図書室情報の削除に失敗しました。',
        variant: 'destructive',
      });
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentLibrary?.id ? '図書室を編集' : '新規図書室追加'}
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
            <DialogTitle>図書室の削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>「{libraryToDelete?.name}」を削除してもよろしいですか？</p>
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
