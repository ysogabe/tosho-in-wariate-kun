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
import { Position, positionsApi } from '@/services/api';
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Partial<Position> | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data = await positionsApi.getAll();
      setPositions(data);
    } catch (error) {
      console.error('役職情報の取得に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '役職情報の取得に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentPosition({
      position_name: '',
      description: '',
    });
    setEditDialogOpen(true);
  };

  const handleEdit = (position: Position) => {
    setCurrentPosition(position);
    setEditDialogOpen(true);
  };

  const handleDelete = (position: Position) => {
    setPositionToDelete(position);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentPosition?.position_name) {
      toast({
        title: 'エラー',
        description: '役職名は必須です。',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      if (currentPosition.id) {
        // 更新
        await positionsApi.update(currentPosition.id, currentPosition);
        toast({
          title: '成功',
          description: '役職情報を更新しました。',
        });
      } else {
        // 新規作成
        await positionsApi.create(currentPosition as Omit<Position, 'id' | 'created_at' | 'updated_at'>);
        toast({
          title: '成功',
          description: '役職情報を作成しました。',
        });
      }
      
      setEditDialogOpen(false);
      setCurrentPosition(null);
      await loadPositions();
    } catch (error) {
      console.error('役職情報の保存に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '役職情報の保存に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!positionToDelete) return;

    try {
      await positionsApi.delete(positionToDelete.id);
      toast({
        title: '成功',
        description: '役職情報を削除しました。',
      });
      setDeleteDialogOpen(false);
      setPositionToDelete(null);
      await loadPositions();
    } catch (error) {
      console.error('役職情報の削除に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '役職情報の削除に失敗しました。',
        variant: 'destructive',
      });
    }
  };

  const filteredPositions = positions.filter(position =>
    position.position_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()))
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
          placeholder="役職名で検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={handleAdd}>
          <PlusIcon className="mr-2 h-4 w-4" /> 新規役職
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">役職名</TableHead>
              <TableHead className="w-[300px]">説明</TableHead>
              <TableHead className="w-[150px]">作成日</TableHead>
              <TableHead className="w-[150px]">更新日</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  役職情報がありません
                </TableCell>
              </TableRow>
            ) : (
              filteredPositions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.position_name}</TableCell>
                  <TableCell>{position.description || '-'}</TableCell>
                  <TableCell>{format(new Date(position.created_at), 'yyyy/MM/dd')}</TableCell>
                  <TableCell>{format(new Date(position.updated_at), 'yyyy/MM/dd')}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(position)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(position)}
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
              {currentPosition?.id ? '役職を編集' : '新規役職追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position_name">役職名</Label>
              <Input
                id="position_name"
                value={currentPosition?.position_name || ''}
                onChange={(e) => setCurrentPosition(prev => ({
                  ...prev,
                  position_name: e.target.value,
                }))}
                placeholder="役職名を入力してください"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <textarea
                id="description"
                value={currentPosition?.description || ''}
                onChange={(e) => setCurrentPosition(prev => ({
                  ...prev,
                  description: e.target.value,
                }))}
                placeholder="説明を入力してください"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <DialogTitle>役職の削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>「{positionToDelete?.position_name}」を削除してもよろしいですか？</p>
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
