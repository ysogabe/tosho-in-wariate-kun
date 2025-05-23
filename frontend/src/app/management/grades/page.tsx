'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

interface Grade {
  id: number;
  name: string;
  description: string;
}

const API_URL = 'http://localhost:5001/api/grades';

export default function GradesManagementPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [editingGrade, setEditingGrade] = useState<Partial<Grade> | null>(null); // Allow partial for new grades
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);


  const fetchGrades = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data: Grade[] = await response.json();
      setGrades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade || !editingGrade.name) {
      setFormError('学年名を入力してください。');
      return;
    }
    setFormError(null);
    setIsLoading(true);

    const method = editingGrade.id && editingGrade.id !== 0 ? 'PUT' : 'POST';
    const url = editingGrade.id && editingGrade.id !== 0 ? `${API_URL}/${editingGrade.id}` : API_URL;
    
    const payload: { name: string; description: string } = {
        name: editingGrade.name,
        description: editingGrade.description || '',
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
      
      await fetchGrades(); // Re-fetch to update the list
      setShowForm(false);
      setEditingGrade(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '保存に失敗しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (grade: Grade) => {
    setEditingGrade({ ...grade });
    setFormError(null);
    setShowForm(true);
  };

  const startAddingNew = () => {
    setEditingGrade({ id: 0, name: '', description: '' }); // Use 0 or undefined for new grade ID
    setFormError(null);
    setShowForm(true);
  };

  const deleteGrade = async (id: number) => {
    if (confirm('この学年を削除してもよろしいですか？')) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `API Error: ${response.status} ${response.statusText}` }));
          throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        }
        await fetchGrades(); // Re-fetch after deletion
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
    setEditingGrade(null);
    setFormError(null);
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeIn">
      <div className="flex items-center mb-6">
        <Link href="/management" className="mr-4 text-primary hover:text-primary-dark transition-colors">
          <FaArrowLeft className="text-2xl" />
        </Link>
        <h1 className="text-3xl font-bold text-text">✨ 学年管理 ✨</h1>
      </div>

      <div className="bg-white bg-opacity-80 rounded-2xl p-6 shadow-md border-2 border-dashed border-secondary mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text">学年一覧</h2>
          <button
            onClick={startAddingNew}
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center disabled:opacity-50"
          >
            <FaPlus className="mr-2" />
            新規追加
          </button>
        </div>

        {isLoading && grades.length === 0 && <p className="text-center text-gray-500">データを読み込み中...</p>}
        {error && <p className="text-center text-red-500 my-4">エラー: {error}</p>}
        {!isLoading && !error && grades.length === 0 && <p className="text-center text-gray-500">登録されている学年データがありません。</p>}

        {grades.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">ID</th>
                  <th className="py-3 px-6 text-left">学年名</th>
                  <th className="py-3 px-6 text-left">説明</th>
                  <th className="py-3 px-6 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {grades.map((grade) => (
                  <tr key={grade.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left">{grade.id}</td>
                    <td className="py-3 px-6 text-left">{grade.name}</td>
                    <td className="py-3 px-6 text-left">{grade.description}</td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button
                          onClick={() => startEditing(grade)}
                          disabled={isLoading}
                          className="transform hover:text-blue-500 hover:scale-110 transition-all mx-2 disabled:opacity-50"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => deleteGrade(grade.id)}
                          disabled={isLoading}
                          className="transform hover:text-red-500 hover:scale-110 transition-all mx-2 disabled:opacity-50"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 学年編集フォーム */}
      {showForm && editingGrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-text mb-4">
              {editingGrade.id && editingGrade.id !== 0 ? '学年を編集' : '新しい学年を追加'}
            </h2>
            <form onSubmit={handleSaveGrade}>
              {formError && <p className="text-red-500 text-sm mb-3">{formError}</p>}
              <div className="mb-4">
                <label htmlFor="gradeName" className="block text-text-light mb-2">学年名</label>
                <input
                  id="gradeName"
                  type="text"
                  value={editingGrade.name || ''}
                  onChange={(e) => setEditingGrade({ ...editingGrade, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="学年名を入力"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="gradeDescription" className="block text-text-light mb-2">説明</label>
                <input
                  id="gradeDescription"
                  type="text"
                  value={editingGrade.description || ''}
                  onChange={(e) => setEditingGrade({ ...editingGrade, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="説明を入力"
                  disabled={isLoading}
                />
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
                  disabled={isLoading}
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
