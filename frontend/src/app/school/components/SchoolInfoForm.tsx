'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { School, schoolsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function SchoolInfoForm() {
  const [school, setSchool] = useState<Partial<School>>({
    school_name: '',
    first_term_start: '',
    first_term_end: '',
    second_term_start: '',
    second_term_end: '',
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSchoolInfo();
  }, []);

  const loadSchoolInfo = async () => {
    try {
      setLoading(true);
      const schools = await schoolsApi.getAll();
      if (schools.length > 0) {
        setSchool(schools[0]);
      }
    } catch (error) {
      console.error('学校情報の取得に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '学校情報の取得に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (school.id) {
        // 更新
        await schoolsApi.update(school.id, school);
        toast({
          title: '成功',
          description: '学校情報を更新しました。',
        });
      } else {
        // 新規作成
        const newSchool = await schoolsApi.create(school as Omit<School, 'id' | 'created_at' | 'updated_at'>);
        setSchool(newSchool);
        toast({
          title: '成功',
          description: '学校情報を作成しました。',
        });
      }
    } catch (error) {
      console.error('学校情報の保存に失敗しました:', error);
      toast({
        title: 'エラー',
        description: '学校情報の保存に失敗しました。',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof School, value: string | boolean) => {
    setSchool(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <Label htmlFor="school_name">学校名</Label>
          <Input
            id="school_name"
            name="school_name"
            value={school.school_name || ''}
            onChange={(e) => handleInputChange('school_name', e.target.value)}
            placeholder="学校名を入力してください"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_term_start">前期開始日</Label>
            <Input
              id="first_term_start"
              name="first_term_start"
              type="date"
              value={school.first_term_start || ''}
              onChange={(e) => handleInputChange('first_term_start', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="first_term_end">前期終了日</Label>
            <Input
              id="first_term_end"
              name="first_term_end"
              type="date"
              value={school.first_term_end || ''}
              onChange={(e) => handleInputChange('first_term_end', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="second_term_start">後期開始日</Label>
            <Input
              id="second_term_start"
              name="second_term_start"
              type="date"
              value={school.second_term_start || ''}
              onChange={(e) => handleInputChange('second_term_start', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="second_term_end">後期終了日</Label>
            <Input
              id="second_term_end"
              name="second_term_end"
              type="date"
              value={school.second_term_end || ''}
              onChange={(e) => handleInputChange('second_term_end', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="active"
            name="active"
            type="checkbox"
            checked={school.active || false}
            onChange={(e) => handleInputChange('active', e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <Label htmlFor="active">アクティブ</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={loadSchoolInfo} disabled={saving}>
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
}
