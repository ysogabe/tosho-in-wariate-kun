'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// MembersTable コンポーネントを dynamic インポートでクライアントサイドでのみレンダリング
const MembersTable = dynamic(() => import('./MembersTable'), {
  ssr: false, // サーバーサイドレンダリングを無効化
  loading: () => <p className="text-center py-4">テーブルを読み込み中...</p>
});

interface CommitteeMember {
  id: number;
  name: string;
  role: string;
  class_id: number;
  class_name: string;
  grade_id: number;
  grade_name: string;
}

interface ClassData {
  id: number;
  name: string;
  grade_id: number;
  grade_name: string;
}

// Define the type for the object being edited, allowing for partial data, especially for new members
interface EditingMemberState {
  id?: number; // Optional for new members
  name: string;
  class_id: number | string; // Can be string from select, convert to number before sending
  role: string;
}


const API_MEMBERS_URL = 'http://localhost:5012/api/committee-members';
const API_CLASSES_URL = 'http://localhost:5012/api/classes';

export default function CommitteeMembersPage() {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [editingMember, setEditingMember] = useState<EditingMemberState | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState<number | null>(null);
  const [filterName, setFilterName] = useState<string>('');
  
  // 学年リストを作成（重複なし）
  const availableGrades = useMemo(() => {
    console.log('Creating availableGrades from availableClasses:', availableClasses);
    if (!availableClasses.length) return [];
    
    const grades = availableClasses.reduce<{id: number, name: string}[]>((acc, cls) => {
      if (!acc.some(g => g.id === cls.grade_id)) {
        acc.push({
          id: cls.grade_id,
          name: cls.grade_name
        });
      }
      return acc;
    }, []);
    
    console.log('Generated availableGrades:', grades);
    return grades.sort((a, b) => a.id - b.id);
  }, [availableClasses]);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching members from:', API_MEMBERS_URL);
      const response = await fetch(API_MEMBERS_URL);
      console.log('Members response status:', response.status);
      if (!response.ok) throw new Error(`API Error (Members): ${response.status} ${response.statusText}`);
      const data: CommitteeMember[] = await response.json();
      console.log('Members data:', data);
      setMembers(data);
    } catch (err) {
      console.error('Fetch members error:', err);
      setError(err instanceof Error ? err.message : '委員データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    // No separate loading state for classes, assume it's quick or part of overall loading
    try {
      console.log('Fetching classes from:', API_CLASSES_URL);
      const response = await fetch(API_CLASSES_URL);
      console.log('Classes response status:', response.status);
      if (!response.ok) throw new Error(`API Error (Classes): ${response.status} ${response.statusText}`);
      const data: ClassData[] = await response.json();
      console.log('Classes data:', data);
      setAvailableClasses(data);
    } catch (err) {
      console.error('Fetch classes error:', err);
      // Set a general error or a specific one for class fetching if needed
      setError(err instanceof Error ? err.message : 'クラスデータの取得に失敗しました。');
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchClasses(); // Fetch classes when component mounts
  }, []);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name || !editingMember.class_id) {
      setFormError('名前とクラスを選択してください。');
      return;
    }
    setFormError(null);
    setIsLoading(true);

    const method = editingMember.id ? 'PUT' : 'POST';
    const url = editingMember.id ? `${API_MEMBERS_URL}/${editingMember.id}` : API_MEMBERS_URL;
    
    const payload = {
      name: editingMember.name,
      class_id: Number(editingMember.class_id), // Ensure class_id is a number
      role: editingMember.role,
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `API Error: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
      }
      await fetchMembers();
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (member: CommitteeMember) => {
    setEditingMember({
      id: member.id,
      name: member.name,
      class_id: member.class_id,
      role: member.role,
    });
    setFormError(null);
    setShowForm(true);
  };

  const startAddingNew = () => {
    setEditingMember({
      name: '',
      class_id: availableClasses.length > 0 ? availableClasses[0].id : '', // Default to first class or empty
      role: '委員', // Default role
    });
    setFormError(null);
    setShowForm(true);
  };

  const deleteMember = async (id: number) => {
    if (confirm('この委員を削除してもよろしいですか？')) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_MEMBERS_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `API Error: ${response.status} ${response.statusText}` }));
          throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        }
        await fetchMembers();
      } catch (err) {
        setError(err instanceof Error ? err.message : '削除に失敗しました。');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingMember(null);
    setFormError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/management" className="text-primary hover:text-primary-dark mr-4">
            <FaArrowLeft className="text-xl" />
          </Link>
          <h1 className="text-3xl font-bold text-text">図書委員管理</h1>
        </div>
        <button
          onClick={startAddingNew}
          disabled={isLoading || availableClasses.length === 0}
          className="flex items-center bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPlus className="mr-2" />
          新規追加
        </button>
      </div>

      {/* フィルタリングセクション */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="nameFilter" className="block text-sm font-medium text-gray-700 mb-1">
              <FaSearch className="inline mr-2" />名前で検索
            </label>
            <input
              id="nameFilter"
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="名前を入力..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="gradeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              <FaFilter className="inline mr-2" />学年で絞り込み
            </label>
            <select
              id="gradeFilter"
              value={filterGrade === null ? '' : filterGrade}
              onChange={(e) => setFilterGrade(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">すべての学年</option>
              {availableGrades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">図書委員一覧</h2>
        
        {isLoading && members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            データを読み込み中...
          </div>
        )}
        
        {error && (
          <div className="text-center py-4 text-red-500">
            <div className="font-bold mb-2">エラーが発生しました:</div>
            <div className="text-sm">{error}</div>
            <div className="mt-2 text-xs text-gray-500">
              availableClasses.length: {availableClasses.length}, 
              availableGrades.length: {availableGrades.length}
            </div>
          </div>
        )}
        
        {!isLoading && members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            委員データがありません。新しい委員を追加してください。
          </div>
        )}
        
        {!isLoading && members.length > 0 && (
          <div className="overflow-x-auto">
            <MembersTable 
              members={members} 
              isLoading={isLoading} 
              availableClasses={availableClasses} 
              startEditing={startEditing} 
              deleteMember={deleteMember}
              filterGrade={filterGrade}
              filterName={filterName}
            />
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {showForm && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text mb-4">
              {editingMember.id ? '委員を編集' : '新しい委員を追加'}
            </h2>
            <form onSubmit={handleSaveMember}>
              {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
              <div className="mb-4">
                <label htmlFor="memberName" className="block text-text-light mb-2">名前</label>
                <input
                  id="memberName"
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="名前を入力"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="memberClass" className="block text-text-light mb-2">クラス</label>
                <select
                  id="memberClass"
                  value={editingMember.class_id}
                  onChange={(e) => setEditingMember({ ...editingMember, class_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading || availableClasses.length === 0}
                >
                  {availableClasses.length === 0 && <option value="">クラスを読み込み中...</option>}
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.grade_name} - {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="memberRole" className="block text-text-light mb-2">役割</label>
                <select
                  id="memberRole"
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={isLoading}
                >
                  <option value="委員長">委員長</option>
                  <option value="副委員長">副委員長</option>
                  <option value="書記">書記</option>
                  <option value="会計">会計</option>
                  <option value="メンバー">メンバー</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isLoading || availableClasses.length === 0}
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
